'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShippingForm } from "./ShippingForm";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { uploadDesignFile } from '@/lib/actions/ecommerce';

// Replace with your actual Publishable Key from environment
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type ProductModalProps = {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    designId?: number; // Optional existing Printful ID
};

const VARIANTS = [
    { id: 12345, name: '18" x 24" Framed', price: 9900 },
    { id: 67890, name: '24" x 36" Framed', price: 14900 },
];

export function ProductModal({ isOpen, onClose, imageUrl, designId }: ProductModalProps) {
    const [step, setStep] = useState(1); // 1: Select, 2: Shipping, 3: Payment
    const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);
    const [clientSecret, setClientSecret] = useState("");
    const [uploadedDesignId, setUploadedDesignId] = useState<number | string | null>(designId || null);

    const methods = useForm({
        defaultValues: {
            shipping: {
                name: '',
                address: {
                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: 'US'
                }
            }
        }
    });

    const handleNextLimit = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            // Validate Shipping
            const isValid = await methods.trigger();
            if (!isValid) return;

            // Create Order/Intent
            try {
                // 1. Upload Design if needed
                let currentDesignId = uploadedDesignId;
                if (!currentDesignId) {
                    toast.info("Uploading high-resolution print file...");

                    // Fetch blob from Blob URL
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();

                    // Create FormData
                    const formData = new FormData();
                    formData.append('file', blob, 'poster.png');

                    // Upload to Storage via Server Action
                    // We import dynamically to avoid server module issues in client component if possible, 
                    // but Next.js handles server actions imports fine.
                    // Assuming uploadDesignFile is imported or we use fetch to an API route wrapping it.
                    // Since I created a server action, I should import it. 
                    // BUT, to avoid import issues right now (need to add import statement), 
                    // I will use the /api/printful/upload route BUT modify it to accept the SIGNED URL.
                    // Wait, existing /api/printful/upload takes {url}.
                    // So:
                    // 1. Call server action to upload -> get signedURL.
                    // 2. Call /api/printful/upload with { url: signedURL }.

                    // Oops, I can't import server action here without adding import statement at top.
                    // I'll assume I can add the import in a separate tool call or just use fetch if I made an API route for upload.
                    // I didn't make an API route for storage upload, I made a server action.
                    // I'll add the import via `replace_file_content` at the top first.
                    // Or I can do it all in one go if I knew the import lines.
                    // I'll assume I'll add the import.

                    // For now, I'll write the logic assuming `uploadDesignFile` is available.
                    const { signedUrl } = await uploadDesignFile(formData);

                    // Now send secure link to Printful
                    const uploadRes = await fetch('/api/printful/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: signedUrl })
                    });

                    if (!uploadRes.ok) throw new Error('Failed to send design to Printful');
                    const uploadData = await uploadRes.json();
                    currentDesignId = uploadData.id;
                    setUploadedDesignId(currentDesignId);
                }

                // 2. Create Payment Intent
                const shippingData = methods.getValues().shipping;
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variant_id: selectedVariant.id,
                        design_file_id: currentDesignId,
                        quantity: 1,
                        shipping: shippingData
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    console.error("Checkout initialization failed", errData);
                    throw new Error(errData.error || 'Failed to initialize checkout');
                }
                const data = await res.json();
                setClientSecret(data.clientSecret);
                setStep(3);

            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Something went wrong. Please try again.");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Order Framed Print</DialogTitle>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="aspect-video relative rounded-md overflow-hidden border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {VARIANTS.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => setSelectedVariant(v)}
                                    className={`cursor-pointer border rounded-lg p-4 text-center transition-colors ${selectedVariant.id === v.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                                >
                                    <div className="font-bold">{v.name}</div>
                                    <div className="text-muted-foreground">${v.price / 100}</div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleNextLimit} className="w-full">Continue to Shipping</Button>
                    </div>
                )}

                <FormProvider {...methods}>
                    {step === 2 && (
                        <div className="space-y-4">
                            <ShippingForm />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(1)} type="button">Back</Button>
                                <Button onClick={handleNextLimit} className="w-full" type="button">Continue to Payment</Button>
                            </div>
                        </div>
                    )}
                </FormProvider>

                {step === 3 && clientSecret && (
                    <div className="space-y-4">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm amount={selectedVariant.price} onSuccess={onClose} />
                        </Elements>
                        <Button variant="ghost" onClick={() => setStep(2)} className="w-full text-sm">Back to Shipping</Button>
                    </div>
                )}

            </DialogContent>
        </Dialog >
    );
}

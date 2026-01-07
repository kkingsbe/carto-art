'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShippingForm } from "./ShippingForm";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getMarginAdjustedVariants } from '@/lib/actions/ecommerce';
import { VariantCard, VariantCardSkeleton } from './VariantCard';
import { ChevronLeft, Loader2, Check, Package, Truck, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

// Replace with your actual Publishable Key from environment
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type ProductModalProps = {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    designId?: number; // Optional existing Printful ID
    aspectRatio?: string; // User's export aspect ratio (e.g., '2:3', '1:1')
    orientation?: 'portrait' | 'landscape';
};

// Parse variant dimensions from name (e.g., "10×10", "10″×10″", "10"×10"" -> { width: 10, height: 10 })
function parseVariantDimensions(name: string): { width: number; height: number } | null {
    // Match patterns like: 10×10, 10x10, 10″×10″, 10"×10", etc.
    // The [″"]? handles optional inch symbols after each number
    const match = name.match(/(\d+)[″"]?\s*[×x]\s*(\d+)/);
    if (match) {
        return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }
    return null;
}

// Calculate aspect ratio from dimensions
function getAspectRatioFromDimensions(width: number, height: number): number {
    return width / height;
}

// Get numeric aspect ratio from string (e.g., '2:3' -> 0.667)
function parseAspectRatio(ratio: string, orientation: 'portrait' | 'landscape' = 'portrait'): number {
    if (ratio === 'ISO') {
        const base = 1 / Math.sqrt(2);
        return orientation === 'portrait' ? base : 1 / base;
    }
    const [w, h] = ratio.split(':').map(Number);
    if (!w || !h) return 1;
    const base = w / h;
    return orientation === 'portrait' ? base : 1 / base;
}

// Check if variant matches the target aspect ratio (with tolerance)
function variantMatchesAspectRatio(
    variant: { name: string },
    targetRatio: number,
    tolerance: number = 0.20 // 20% tolerance to accommodate various sizes
): boolean {
    const dims = parseVariantDimensions(variant.name);
    if (!dims) return true; // Include variants without parseable dimensions (e.g., "Enhanced Matte Paper Framed Poster")

    const variantRatio = dims.width / dims.height;
    const diff = Math.abs(variantRatio - targetRatio) / targetRatio;
    return diff <= tolerance;
}

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { number: 1, label: 'Select Size', icon: Package },
        { number: 2, label: 'Shipping', icon: Truck },
        { number: 3, label: 'Payment', icon: CreditCard },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                const StepIcon = step.icon;

                return (
                    <div key={step.number} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                    isCompleted && "bg-primary text-primary-foreground",
                                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <StepIcon className="w-5 h-5" />
                                )}
                            </div>
                            <span className={cn(
                                "text-xs mt-1 font-medium transition-colors",
                                (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "w-12 h-0.5 mx-2 mb-5 transition-colors",
                                    currentStep > step.number ? "bg-primary" : "bg-muted"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function ProductModal({ isOpen, onClose, imageUrl, designId, aspectRatio = '2:3', orientation = 'portrait' }: ProductModalProps) {
    const [step, setStep] = useState(1); // 1: Select, 2: Shipping, 3: Payment
    const [variants, setVariants] = useState<any[]>([]);
    const [isLoadingVariants, setIsLoadingVariants] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    // Calculate the target aspect ratio from props
    const targetAspectRatio = parseAspectRatio(aspectRatio, orientation);

    useEffect(() => {
        const fetchVariants = async () => {
            setIsLoadingVariants(true);
            try {
                const data = await getMarginAdjustedVariants();
                // Filter variants to match the user's aspect ratio
                const filteredVariants = data.filter(v =>
                    variantMatchesAspectRatio(v, targetAspectRatio)
                );

                // Fallback: if no variants match, show all variants
                const variantsToShow = filteredVariants.length > 0 ? filteredVariants : data;

                setVariants(variantsToShow);
                if (variantsToShow.length > 0) {
                    setSelectedVariant(variantsToShow[0]);
                }
            } catch (e) {
                console.error("Failed to fetch variants", e);
                toast.error("Failed to load product options");
            } finally {
                setIsLoadingVariants(false);
            }
        };
        if (isOpen) {
            fetchVariants();
        }
    }, [isOpen, targetAspectRatio]);

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

    const [mockupUrl, setMockupUrl] = useState<string | null>(null);
    const [isMockupLoading, setIsMockupLoading] = useState(false);
    const [previewPublicUrl, setPreviewPublicUrl] = useState<string | null>(null);

    // Initial Image Upload for Printful Access
    useEffect(() => {
        const uploadImageForPreview = async () => {
            if (!imageUrl || previewPublicUrl) return;

            try {
                // If it's already a remote URL (not a blob), we might be able to use it directly 
                // IF it is publicly accessible. But usually imageUrl here is a blob: URL from the editor.
                if (!imageUrl.startsWith('blob:')) {
                    setPreviewPublicUrl(imageUrl);
                    return;
                }

                const response = await fetch(imageUrl);
                const blob = await response.blob();
                console.log('Upload Preview: Blob size:', blob.size, 'Type:', blob.type);

                if (blob.size === 0) {
                    console.error('Upload Preview: Blob is empty!');
                    throw new Error('Image data is empty');
                }

                // const formData = new FormData();
                // formData.append('file', blob, 'preview.png');

                // Use API route to upload file raw (bypassing FormData issues)
                const uploadRes = await fetch('/api/upload-design', {
                    method: 'POST',
                    headers: {
                        'Content-Type': blob.type || 'image/png',
                    },
                    body: blob,
                });

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json();
                    throw new Error(errorData.error || 'Failed to upload preview');
                }

                const { signedUrl } = await uploadRes.json();
                setPreviewPublicUrl(signedUrl);
            } catch (e) {
                console.error("Failed to upload preview image", e);
            }
        };

        if (isOpen && imageUrl) {
            uploadImageForPreview();
        }
    }, [isOpen, imageUrl, previewPublicUrl]);

    // Generate Mockup when variant changes (Debounced)
    useEffect(() => {
        if (selectedVariant && previewPublicUrl) {
            setIsMockupLoading(true);
            const timer = setTimeout(() => {
                generateMockup(selectedVariant.id, previewPublicUrl)
                    .finally(() => setIsMockupLoading(false));
            }, 1000); // 1s debounce to respect rate limits

            return () => clearTimeout(timer);
        }
    }, [selectedVariant, previewPublicUrl]);


    const generateMockup = async (variantId: number, designUrl: string) => {
        try {
            const res = await fetch('/api/printful/mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variant_id: variantId,
                    image_url: designUrl
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.mockup_url) {
                    setMockupUrl(data.mockup_url);
                }
            }
        } catch (e) {
            console.error("Mockup generation failed", e);
        }
    };

    const [isProcessing, setIsProcessing] = useState(false);

    const handleNextLimit = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            // Validate Shipping
            const isValid = await methods.trigger();
            if (!isValid) return;

            setIsProcessing(true);

            // Create Order/Intent
            try {
                let currentDesignId = uploadedDesignId;
                let finalSignedUrl = previewPublicUrl || imageUrl;

                if (!currentDesignId) {
                    if (previewPublicUrl && previewPublicUrl.startsWith('http')) {
                        finalSignedUrl = previewPublicUrl;
                    } else {
                        toast.info("Preparing print file...");
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const formData = new FormData();
                        formData.append('file', blob, 'poster.png');

                        // Use API route to upload file (Server Actions have issues with blob serialization)
                        const uploadRes = await fetch('/api/upload-design', {
                            method: 'POST',
                            body: formData,
                        });

                        if (!uploadRes.ok) {
                            const errorData = await uploadRes.json();
                            throw new Error(errorData.error || 'Failed to upload print file');
                        }

                        const { signedUrl } = await uploadRes.json();
                        finalSignedUrl = signedUrl;
                    }

                    try {
                        // Register with Printful
                        const uploadRes = await fetch('/api/printful/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: finalSignedUrl }),
                        });

                        if (!uploadRes.ok) {
                            console.warn('Printful library upload failed, falling back to direct URL');
                            currentDesignId = finalSignedUrl;
                        } else {
                            const uploadData = await uploadRes.json();
                            currentDesignId = uploadData.id;
                        }
                    } catch (err) {
                        console.error('Printful upload error, falling back to direct URL:', err);
                        currentDesignId = finalSignedUrl;
                    }

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
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Order Framed Print</DialogTitle>
                </DialogHeader>

                <StepIndicator currentStep={step} />

                {step === 1 && (
                    <div className="space-y-6">
                        {/* Mockup Preview */}
                        <div className="relative rounded-xl overflow-hidden border bg-gradient-to-br from-muted/50 to-muted">
                            <div className="aspect-[4/3] relative flex items-center justify-center p-4">
                                <img
                                    src={mockupUrl || imageUrl}
                                    alt="Preview"
                                    className={cn(
                                        "max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-500",
                                        isMockupLoading ? "opacity-50 scale-95" : "opacity-100 scale-100"
                                    )}
                                />
                                {isMockupLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                        <div className="text-muted-foreground">${selectedVariant.display_price_cents / 100}</div>
                                        <span className="text-sm text-muted-foreground">Generating preview...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Variant Selection */}
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Choose your size</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {isLoadingVariants ? (
                                    <>
                                        <VariantCardSkeleton />
                                        <VariantCardSkeleton />
                                        <VariantCardSkeleton />
                                    </>
                                ) : (
                                    variants.map(v => (
                                        <VariantCard
                                            key={v.id}
                                            variant={v}
                                            isSelected={selectedVariant?.id === v.id}
                                            onClick={() => setSelectedVariant(v)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleNextLimit}
                            className="w-full h-12 text-base font-medium"
                            disabled={!selectedVariant || isLoadingVariants}
                        >
                            Continue to Shipping
                        </Button>
                    </div>
                )}

                <FormProvider {...methods}>
                    {step === 2 && (
                        <div className="space-y-4">
                            <ShippingForm />
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    type="button"
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNextLimit}
                                    className="flex-1 h-11"
                                    type="button"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Continue to Payment'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </FormProvider>

                {step === 3 && clientSecret && selectedVariant && (
                    <div className="space-y-4">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm
                                amount={selectedVariant.display_price_cents}
                                onSuccess={onClose}
                                mockupUrl={mockupUrl}
                            />
                        </Elements>
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="w-full text-sm flex items-center justify-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Shipping
                        </Button>
                    </div>
                )}

            </DialogContent>
        </Dialog >
    );
}

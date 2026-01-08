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
import { FrameMockupRenderer } from './FrameMockupRenderer';
import { ChevronLeft, Loader2, Check, Package, Truck, CreditCard, Eye, EyeOff } from 'lucide-react';
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

// Safely parse print area which might be a JSON string
function getSafePrintArea(area: any) {
    if (!area) return null;

    let parsed = area;
    if (typeof area === 'string') {
        try {
            parsed = JSON.parse(area);
        } catch (e) {
            console.error("Failed to parse mockup_print_area", e);
            return null;
        }
    }

    // Validation: ensure we have numbers
    if (typeof parsed.x !== 'number' || typeof parsed.width !== 'number') {
        return null;
    }

    return parsed;
}

export function ProductModal({ isOpen, onClose, imageUrl, designId, aspectRatio = '2:3', orientation = 'portrait' }: ProductModalProps) {
    const [step, setStep] = useState(1); // 1: Select, 2: Shipping, 3: Payment
    const [variants, setVariants] = useState<any[]>([]);
    const [isLoadingVariants, setIsLoadingVariants] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [showTemplateOnly, setShowTemplateOnly] = useState(false);

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

    // Note: We no longer need to upload image for preview since FrameMockupRenderer
    // works with blob URLs directly via Canvas. We only upload when proceeding to checkout.
    const [previewPublicUrl, setPreviewPublicUrl] = useState<string | null>(null);

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
                        {/* Mockup Preview - Now using client-side Canvas compositing */}
                        <div className="relative rounded-xl overflow-hidden border bg-slate-50/50">
                            {/* Toggle button for template-only view */}
                            {selectedVariant?.mockup_template_url && (
                                <button
                                    onClick={() => setShowTemplateOnly(!showTemplateOnly)}
                                    className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background transition-colors"
                                    title={showTemplateOnly ? "Show with design" : "Show template only"}
                                >
                                    {showTemplateOnly ? (
                                        <Eye className="w-4 h-4" />
                                    ) : (
                                        <EyeOff className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                            <div className="aspect-[4/3] relative flex items-center justify-center p-4">
                                {selectedVariant?.mockup_template_url ? (
                                    showTemplateOnly ? (
                                        /* Template-only view */
                                        <img
                                            src={`/api/proxy-image?url=${encodeURIComponent(selectedVariant.mockup_template_url)}`}
                                            alt="Template preview"
                                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl m-auto"
                                        />
                                    ) : (
                                        <FrameMockupRenderer
                                            templateUrl={selectedVariant.mockup_template_url}
                                            printArea={getSafePrintArea(selectedVariant.mockup_print_area)}
                                            designUrl={imageUrl}
                                            className="w-full h-full"
                                            imageClassName="rounded-lg shadow-2xl"
                                            alt="Product preview"
                                        />
                                    )
                                ) : (
                                    /* Fallback: show raw design if no template available */
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl m-auto"
                                    />
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
                                templateUrl={selectedVariant.mockup_template_url}
                                printArea={getSafePrintArea(selectedVariant.mockup_print_area)}
                                designUrl={imageUrl}
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

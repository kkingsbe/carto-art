'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { ShippingForm } from "./ShippingForm";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Package, Truck, CreditCard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductPreviewGrid } from './ProductPreviewGrid';
import { FrameMockupRenderer } from './FrameMockupRenderer';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

// Replace with your actual Publishable Key from environment
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function StepIndicator({ currentStep, onChangeStep }: { currentStep: number, onChangeStep: (step: number) => void }) {
    const steps = [
        { number: 1, label: 'Select Size', icon: Package },
        { number: 2, label: 'Shipping', icon: Truck },
        { number: 3, label: 'Payment', icon: CreditCard },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                const StepIcon = step.icon;
                const canNavigate = step.number < currentStep;

                return (
                    <div key={step.number} className="flex items-center">
                        <div
                            className={cn("flex flex-col items-center", canNavigate && "cursor-pointer group")}
                            onClick={() => canNavigate && onChangeStep(step.number)}
                        >
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                    isCompleted && "bg-primary text-primary-foreground",
                                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                                    canNavigate && "group-hover:bg-primary/80"
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

    if (typeof parsed.x !== 'number' || typeof parsed.width !== 'number') {
        return null;
    }

    return parsed;
}

interface OrderStepsProps {
    variants: any[];
    designUrl: string;
    aspectRatio?: string;
    orientation?: 'portrait' | 'landscape';
    product?: {
        description?: string;
        features?: string[];
    };
}

export function OrderSteps({ variants, designUrl, aspectRatio, orientation, product }: OrderStepsProps) {
    const [step, setStep] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<any>(variants.length > 0 ? variants[0] : null);
    const [clientSecret, setClientSecret] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [mockupDataUrl, setMockupDataUrl] = useState<string | null>(null);
    const [priceBreakdown, setPriceBreakdown] = useState<{
        subtotal: number;
        shipping: number;
        tax: number;
        total: number;
    } | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
            setIsCheckingAuth(false);
        };
        checkUser();

        // Track checkout start
        trackEventAction({
            eventType: 'checkout_start',
            eventName: 'checkout_page_loaded',
            sessionId: getSessionId(),
            metadata: {
                design_url: designUrl,
                aspect_ratio: aspectRatio,
                orientation: orientation
            }
        });
    }, []);

    const handleLogin = () => {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${returnUrl}`;
    };

    const methods = useForm({
        defaultValues: {
            email: '',
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

    const handleNext = async () => {
        if (step === 1) {
            if (selectedVariant) {
                // Track Size Selected
                trackEventAction({
                    eventType: 'checkout_step_complete',
                    eventName: 'size_selected',
                    sessionId: getSessionId(),
                    metadata: {
                        step: 1,
                        variant_id: selectedVariant.id,
                        variant_name: selectedVariant.name,
                        price: selectedVariant.display_price_cents
                    }
                });
                setStep(2);
            }
        } else if (step === 2) {
            const isValid = await methods.trigger();
            if (!isValid) return;

            setIsProcessing(true);
            try {
                // Determine design ID - since we're on /order page, designUrl is ALREADY the signed URL from Supabase
                // We just need to register it with Printful or use it directly
                let currentDesignId = designUrl;

                try {
                    // Register with Printful to be safe/proper
                    // Note: In implementation plan we said we'd upload first.
                    // If designUrl is a full URL, we can use it.
                    const uploadRes = await fetch('/api/printful/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: designUrl }),
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        currentDesignId = uploadData.id;
                    }
                } catch (err) {
                    console.error('Printful upload error, using direct URL:', err);
                }

                // Create Payment Intent
                const shippingData = methods.getValues().shipping;
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variant_id: selectedVariant.id,
                        design_file_id: currentDesignId,
                        quantity: 1,
                        shipping: shippingData,
                        email: methods.getValues().email,
                        mockup_data_url: mockupDataUrl
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to initialize checkout');
                }
                const data = await res.json();
                setClientSecret(data.clientSecret);
                if (data.breakdown) {
                    setPriceBreakdown(data.breakdown);
                }
                setStep(3);

            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Something went wrong.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // Handle Shipping Success (implicit in handleNext logic but we can track right before step 3)
    useEffect(() => {
        if (step === 3) {
            trackEventAction({
                eventType: 'checkout_step_complete',
                eventName: 'shipping_entered',
                sessionId: getSessionId(),
                metadata: {
                    step: 2,
                    shipping_country: methods.getValues().shipping.address.country
                }
            });
        }
    }, [step]);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StepIndicator currentStep={step} onChangeStep={setStep} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Preview (Always visible on large screens) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="sticky top-24">
                        <div className="relative rounded-2xl overflow-hidden border bg-slate-50/50 shadow-sm">
                            <div className="aspect-[4/3] relative flex items-center justify-center p-8">
                                {selectedVariant?.mockup_template_url ? (
                                    <FrameMockupRenderer
                                        templateUrl={selectedVariant.mockup_template_url}
                                        printArea={getSafePrintArea(selectedVariant.mockup_print_area)}
                                        designUrl={designUrl}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl m-auto"
                                        alt="Product preview"
                                        onRendered={setMockupDataUrl}
                                    />
                                ) : (
                                    <img
                                        src={designUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl m-auto"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Only show product grid in step 1 on desktop */}
                        <div className="hidden lg:block mt-8">
                            {step === 1 && (
                                <>
                                    <h3 className="text-lg font-semibold mb-4">Select Size</h3>
                                    <ProductPreviewGrid
                                        variants={variants}
                                        designUrl={designUrl}
                                        selectedVariantId={selectedVariant?.id}
                                        onSelectVariant={setSelectedVariant}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions / Forms */}
                <div className="lg:col-span-5">
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="lg:hidden">
                                    <h3 className="text-lg font-semibold mb-4">Select Size</h3>
                                    <ProductPreviewGrid
                                        variants={variants}
                                        designUrl={designUrl}
                                        selectedVariantId={selectedVariant?.id}
                                        onSelectVariant={setSelectedVariant}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold">{selectedVariant?.name}</h2>
                                    <p className="text-3xl font-bold text-primary mt-2">
                                        ${((selectedVariant?.display_price_cents || 0) / 100).toFixed(2)}
                                    </p>
                                    <div className="prose prose-sm dark:prose-invert mt-4 text-muted-foreground">
                                        <p>{product?.description || "Museum-quality poster made on thick matte paper. Add a wonderful accent to your room and office with these posters that are sure to brighten any environment."}</p>
                                        {product?.features && product.features.length > 0 && (
                                            <ul className="mt-2 list-disc pl-4 space-y-1">
                                                {product.features.map((feature: string, i: number) => (
                                                    <li key={i}>{feature}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full text-lg h-12"
                                    onClick={handleNext}
                                    disabled={!selectedVariant || isCheckingAuth}
                                >
                                    {isCheckingAuth ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Checking availability...
                                        </>
                                    ) : (
                                        'Continue to Shipping'
                                    )}
                                </Button>
                            </div>
                        )}

                        <FormProvider {...methods}>
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 border-b pb-4">
                                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                                            {selectedVariant?.image_url && (
                                                <img src={selectedVariant.image_url} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium">{selectedVariant?.name}</div>
                                            <div className="text-muted-foreground">${((selectedVariant?.display_price_cents || 0) / 100).toFixed(2)}</div>
                                        </div>
                                    </div>

                                    <ShippingForm />

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep(1)}
                                            type="button"
                                            className="flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
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
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 border-b pb-4">
                                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                                        {selectedVariant?.image_url && (
                                            <img src={selectedVariant.image_url} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium">{selectedVariant?.name}</div>
                                        <div className="text-muted-foreground">${((selectedVariant?.display_price_cents || 0) / 100).toFixed(2)}</div>
                                    </div>
                                </div>

                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <CheckoutForm
                                        amount={priceBreakdown?.total || selectedVariant.display_price_cents}
                                        onSuccess={() => window.location.href = '/profile?order_success=true'}
                                        templateUrl={selectedVariant.mockup_template_url}
                                        printArea={getSafePrintArea(selectedVariant.mockup_print_area)}
                                        designUrl={designUrl}
                                        breakdown={priceBreakdown}
                                    />
                                </Elements>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(2)}
                                    className="w-full text-sm flex items-center justify-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Shipping
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
import { ChevronLeft, Loader2, Package, Truck, CreditCard, Check, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FrameMockupRenderer } from './FrameMockupRenderer';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';
import { SizeSelectorGrid } from '@/components/store/SizeSelector';
import { MobileStickyCart } from '@/components/store/MobileStickyCart';
import { parseVariantDimensions } from '@/lib/utils/store';

// Replace with your actual Publishable Key from environment
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function StepIndicator({ currentStep, onChangeStep }: { currentStep: number, onChangeStep: (step: number) => void }) {
    const steps = [
        { number: 1, label: 'Select Size', icon: Package },
        { number: 2, label: 'Shipping', icon: Truck },
        { number: 3, label: 'Payment', icon: CreditCard },
    ];

    return (
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 md:mb-8">
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
                                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300",
                                    isCompleted && "bg-green-500 text-white",
                                    isCurrent && "bg-gray-900 dark:bg-white text-white dark:text-gray-900 ring-4 ring-gray-900/10 dark:ring-white/20",
                                    !isCompleted && !isCurrent && "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500",
                                    canNavigate && "group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <StepIcon className="w-5 h-5" />
                                )}
                            </div>
                            <span className={cn(
                                "text-xs mt-1.5 font-medium transition-colors hidden sm:block",
                                (isCompleted || isCurrent) ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                            )}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "w-8 md:w-16 h-0.5 mx-2 md:mx-3 mb-0 sm:mb-5 transition-colors",
                                    currentStep > step.number ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
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
                        body: JSON.stringify({
                            url: designUrl,
                            variant_id: selectedVariant.id // Pass variant_id for rotation logic
                        }),
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        currentDesignId = uploadData.id;
                        console.log(`[OrderSteps] Upload successful, rotated: ${uploadData.rotated}`);
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

    // Get size label for display
    const getSizeLabel = (variant: any) => {
        if (!variant) return '';
        const dims = parseVariantDimensions(variant.name);
        return dims ? `${dims.width}×${dims.height}"` : variant.name;
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 pb-32 md:pb-8">
            <StepIndicator currentStep={step} onChangeStep={setStep} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Preview */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="lg:sticky lg:top-24">
                        {/* Main Preview */}
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 shadow-sm">
                            {/* Subtle texture */}
                            <div 
                                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                                }}
                            />
                            
                            <div className="aspect-[4/3] relative flex items-center justify-center p-6 md:p-10">
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

                            {/* Size badge */}
                            {selectedVariant && (
                                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-sm font-medium text-gray-900 dark:text-white shadow-sm">
                                    {getSizeLabel(selectedVariant)}
                                </div>
                            )}
                        </div>

                        {/* Trust signals - Desktop only */}
                        <div className="hidden lg:flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                <span>Quality Guaranteed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Truck className="w-4 h-4" />
                                <span>Free Shipping $75+</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions / Forms */}
                <div className="lg:col-span-5">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-sm">
                        {step === 1 && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                            Premium Quality
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                        Select Your Size
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                                        Choose the perfect size for your space
                                    </p>
                                </div>

                                {/* Size Selector */}
                                <SizeSelectorGrid
                                    variants={variants}
                                    selectedVariantId={selectedVariant?.id}
                                    onSelect={setSelectedVariant}
                                />

                                {/* Selected variant details */}
                                {selectedVariant && (
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {getSizeLabel(selectedVariant)}
                                            </span>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${Math.ceil(selectedVariant.display_price_cents / 100)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {product?.description || "Museum-quality print on thick matte paper. Perfect for any room."}
                                        </p>
                                        {product?.features && product.features.length > 0 && (
                                            <ul className="mt-3 space-y-1">
                                                {product.features.slice(0, 3).map((feature: string, i: number) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Desktop CTA */}
                                <Button
                                    size="lg"
                                    className="w-full text-lg h-14 hidden md:flex"
                                    onClick={handleNext}
                                    disabled={!selectedVariant || isCheckingAuth}
                                >
                                    {isCheckingAuth ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
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
                                    {/* Order summary */}
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                                            {selectedVariant?.mockup_template_url ? (
                                                <FrameMockupRenderer
                                                    templateUrl={selectedVariant.mockup_template_url}
                                                    printArea={getSafePrintArea(selectedVariant.mockup_print_area)}
                                                    designUrl={designUrl}
                                                    className="w-full h-full object-cover"
                                                    alt="Preview"
                                                />
                                            ) : (
                                                <img src={designUrl} className="w-full h-full object-cover" alt="Preview" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {getSizeLabel(selectedVariant)}
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                ${Math.ceil((selectedVariant?.display_price_cents || 0) / 100)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            Shipping Details
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Where should we send your order?
                                        </p>
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
                                            className="flex-1 h-12"
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
                                {/* Order summary */}
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                                        {selectedVariant?.mockup_template_url ? (
                                            <FrameMockupRenderer
                                                templateUrl={selectedVariant.mockup_template_url}
                                                printArea={getSafePrintArea(selectedVariant.mockup_print_area)}
                                                designUrl={designUrl}
                                                className="w-full h-full object-cover"
                                                alt="Preview"
                                            />
                                        ) : (
                                            <img src={designUrl} className="w-full h-full object-cover" alt="Preview" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {getSizeLabel(selectedVariant)}
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            ${Math.ceil((selectedVariant?.display_price_cents || 0) / 100)}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                        Payment
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Complete your order securely
                                    </p>
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

            {/* Mobile Sticky Cart - Only show on step 1 */}
            {step === 1 && (
                <MobileStickyCart
                    productTitle="Print"
                    selectedVariant={selectedVariant}
                    onContinue={handleNext}
                    isProcessing={isCheckingAuth}
                />
            )}
        </div>
    );
}

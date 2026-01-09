'use client';

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { FrameMockupRenderer } from "./FrameMockupRenderer";

interface PrintArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function CheckoutForm({
    amount,
    onSuccess,
    templateUrl,
    printArea,
    designUrl,
    breakdown
}: {
    amount: number;
    onSuccess: () => void;
    templateUrl?: string | null;
    printArea?: PrintArea | null;
    designUrl?: string | null;
    breakdown?: {
        subtotal: number;
        shipping: number;
        tax: number;
        total: number;
    } | null;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required, but if we handle everything via webhooks/state,
                // we might redirect to a success page.
                return_url: `${window.location.origin}/profile/orders?order_success=true`,
            },
        });

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.");
            setLoading(false);
        } else {
            // The UI will likely redirect before this runs
            onSuccess();
        }
    };

    // Use breakdown if available, otherwise just show amount as total (fallback)
    const subtotal = breakdown ? breakdown.subtotal : amount;
    const shipping = breakdown ? breakdown.shipping : 0;
    const tax = breakdown ? breakdown.tax : 0;
    const total = breakdown ? breakdown.total : amount;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted p-4 rounded-md mb-4">
                <h3 className="font-medium mb-4">Order Summary</h3>

                {templateUrl && designUrl && (
                    <div className="mb-4 aspect-square relative rounded-md overflow-hidden bg-white flex items-center justify-center">
                        <FrameMockupRenderer
                            templateUrl={templateUrl}
                            printArea={printArea ?? null}
                            designUrl={designUrl}
                            className="w-full h-full object-contain"
                            alt="Product Preview"
                        />
                    </div>
                )}

                <div className="flex justify-between">
                    <span>Framed Print</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Shipping</span>
                    <span>{breakdown ? `$${(shipping / 100).toFixed(2)}` : "Calculated at next step"}</span>
                </div>
                {breakdown && (
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Tax</span>
                        <span>${(tax / 100).toFixed(2)}</span>
                    </div>
                )}
                <div className="border-t border-gray-300 my-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${(total / 100).toFixed(2)}</span>
                </div>
            </div>

            <PaymentElement />

            {errorMessage && <div className="text-red-500 text-sm mt-2">{errorMessage}</div>}

            <Button disabled={!stripe || loading} className="w-full mt-4" size="lg">
                {loading ? "Processing..." : `Pay $${(total / 100).toFixed(2)}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
                By clicking "Pay", you agree to our <a href="/terms" target="_blank" className="underline hover:text-foreground">Terms of Service</a> and <a href="/privacy" target="_blank" className="underline hover:text-foreground">Privacy Policy</a>.
                We use Stripe for secure payments and Printful for fulfillment.
            </p>
        </form>
    );
}

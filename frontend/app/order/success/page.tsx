import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2 } from 'lucide-react';

export const metadata = {
    title: 'Order Confirmed | CartoArt',
    description: 'Thank you for your purchase.',
};

export default function OrderSuccessPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    // We can use payment_intent_client_secret later to fetch details if we want to show dynamic info
    // For now, a static success message is sufficient and secure

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>
                    <p className="text-muted-foreground">
                        Thank you for your purchase. We've sent a confirmation email with your order details.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
                    <p className="font-medium">What happens next?</p>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        <li>You will receive an order confirmation email</li>
                        <li>We will start printing your map poster</li>
                        <li>Tracking number will be sent when it ships</li>
                    </ul>
                </div>

                <div className="pt-4 space-y-3">
                    <Link href="/editor" className="w-full block">
                        <Button className="w-full" size="lg">
                            Create Another Map
                        </Button>
                    </Link>
                    <Link href="/" className="w-full block">
                        <Button variant="outline" className="w-full">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

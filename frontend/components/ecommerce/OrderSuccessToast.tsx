'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function OrderSuccessToast() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get('order_success') === 'true') {
            toast.success('Order placed successfully!', {
                description: 'Thank you for your purchase. We have sent a confirmation email.',
                duration: 8000,
            });

            // Remove the query param to prevent toast on refresh

            const newParams = new URLSearchParams(searchParams);
            newParams.delete('order_success');
            // content-independent clear of the param
            const newPath = window.location.pathname;
            router.replace(`${newPath}?${newParams.toString()}`);
        }
    }, [searchParams, router]);

    return null;
}

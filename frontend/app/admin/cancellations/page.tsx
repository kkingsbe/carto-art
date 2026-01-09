import { getCancellationRequests } from '@/lib/actions/ecommerce';
import { CancellationRequestsTable } from '@/components/admin/CancellationRequestsTable';

export const dynamic = 'force-dynamic';

export default async function AdminCancellationsPage() {
    const requests = await getCancellationRequests();

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cancellation Requests</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage user cancellation requests. Processing requires both refunding Stripe and cancelling in Printful.
                    </p>
                </div>
            </div>

            <CancellationRequestsTable requests={requests} />
        </div>
    );
}

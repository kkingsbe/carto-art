'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { updateCancellationRequest } from '@/lib/actions/ecommerce';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface CancellationRequest {
    id: string;
    created_at: string;
    order_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    refund_issued: boolean;
    printful_cancelled: boolean;
    order?: any;
    user?: any;
}

export function CancellationRequestsTable({ requests: initialRequests }: { requests: CancellationRequest[] }) {
    const [requests, setRequests] = useState(initialRequests);
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpdate = async (id: string, updates: Partial<CancellationRequest>) => {
        setLoading(id);
        try {
            await updateCancellationRequest(id, updates);

            // Optimistic update
            setRequests(requests.map(r => r.id === id ? { ...r, ...updates } : r));

            // Check if both complete -> mark as approved automatically?
            const req = requests.find(r => r.id === id);
            if (req) {
                const newState = { ...req, ...updates };
                if (newState.refund_issued && newState.printful_cancelled && newState.status === 'pending') {
                    // Auto-approve if both done
                    await updateCancellationRequest(id, { status: 'approved' });
                    setRequests(requests => requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
                    toast.success('Request auto-approved as all checks are complete');
                }
            }

            toast.success('Updated successfully');
        } catch (e: any) {
            toast.error(e.message || 'Update failed');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Refunding</TableHead>
                        <TableHead className="text-center">Printful</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No cancellation requests found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        requests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{format(new Date(req.created_at), 'MMM d, yyyy')}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'h:mm a')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-xs">{req.order_id.slice(0, 8)}</span>
                                        <span className="text-sm font-medium">{req.order?.amount_total ? `$${(req.order.amount_total / 100).toFixed(2)}` : '-'}</span>
                                        {req.order?.printful_order_id && (
                                            <span className="text-xs text-muted-foreground">PF: {req.order.printful_order_id}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{req.user?.display_name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{req.user?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        req.status === 'approved' ? 'default' :
                                            req.status === 'rejected' ? 'destructive' :
                                                'secondary'
                                    }>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center flex-col items-center gap-2">
                                        <Checkbox
                                            checked={req.refund_issued}
                                            onCheckedChange={(checked) => handleUpdate(req.id, { refund_issued: !!checked })}
                                            disabled={!!loading || req.status !== 'pending'}
                                        />
                                        <span className="text-[10px] text-muted-foreground">
                                            {req.refund_issued ? 'Refunded' : 'Pending'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center flex-col items-center gap-2">
                                        <Checkbox
                                            checked={req.printful_cancelled}
                                            onCheckedChange={(checked) => handleUpdate(req.id, { printful_cancelled: !!checked })}
                                            disabled={!!loading || req.status !== 'pending'}
                                        />
                                        <span className="text-[10px] text-muted-foreground">
                                            {req.printful_cancelled ? 'Cancelled' : 'Active'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {req.order?.printful_order_id && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`https://www.printful.com/dashboard/default/orders/${req.order.printful_order_id}`} target="_blank">
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

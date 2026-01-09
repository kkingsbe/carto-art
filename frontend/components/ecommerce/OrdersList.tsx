'use client';

import { format } from 'date-fns';
import { Package, Truck, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';
import { requestOrderCancellation } from '@/lib/actions/ecommerce';
import { toast } from 'sonner';

interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'paid' | 'fulfilled' | 'failed' | 'paid_fulfillment_failed';
    amount_total: number | null;
    shipping_name: string | null;
    shipping_city: string | null;
    shipping_country: string | null;
    quantity: number;
    product_title: string;
    variant_name: string;
    thumbnail_url: string | null;
    tracking_url: string | null;
    tracking_number: string | null;
}

interface OrdersListProps {
    orders: Order[];
}

function OrderItem({ order }: { order: Order }) {
    const [isPending, startTransition] = useTransition();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'fulfilled': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20';
            case 'paid': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20';
            case 'failed':
            case 'paid_fulfillment_failed': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'fulfilled': return <CheckCircle className="w-3 h-3 mr-1.5" />;
            case 'paid': return <Package className="w-3 h-3 mr-1.5" />; // Paid = Processing
            case 'pending': return <Clock className="w-3 h-3 mr-1.5" />;
            case 'failed':
            case 'paid_fulfillment_failed': return <AlertCircle className="w-3 h-3 mr-1.5" />;
            default: return <Package className="w-3 h-3 mr-1.5" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'fulfilled': return 'Shipped';
            case 'paid': return 'Processing';
            case 'pending': return 'Pending';
            case 'failed': return 'Cancelled / Failed';
            case 'paid_fulfillment_failed': return 'Attention Needed';
            default: return status;
        }
    };

    const handleCancel = () => {
        if (!window.confirm('Are you sure you want to request a cancellation for this order?')) return;

        startTransition(async () => {
            try {
                await requestOrderCancellation(order.id);
                toast.success('Cancellation requested. Pass status will update shortly.');
            } catch (e: any) {
                toast.error(e.message || 'Failed to request cancellation');
            }
        });
    };

    // Determine if cancellable: only if paid (processing) or pending. 
    // And usually checked against backend, but UI showing condition is helpful.
    // If 'failed' or 'fulfilled', definitely not cancellable.
    const canCancel = (order.status === 'paid' || order.status === 'pending');

    return (
        <Card className="overflow-hidden bg-[#0d121f] border-white/5 hover:border-white/10 transition-colors">
            <div className="flex flex-col sm:flex-row gap-6 p-5">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-24 aspect-[4/5] bg-white/5 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                    {order.thumbnail_url ? (
                        <Image
                            src={order.thumbnail_url}
                            alt={order.product_title}
                            fill
                            className="object-cover"
                            unoptimized // Avoid next/image domain checks for dynamic signed URLs
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Package className="w-8 h-8" />
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-lg text-[#f5f0e8] leading-tight mb-1">
                                    {order.product_title}
                                </h3>
                                <p className="text-[#9ca3af] text-sm font-medium">
                                    {order.variant_name}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-lg text-white">
                                    {order.amount_total
                                        ? `$${(order.amount_total / 100).toFixed(2)}`
                                        : '-'
                                    }
                                </span>
                                <span className="text-xs text-[#6b7280]">
                                    Qty: {order.quantity}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6b7280]">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-xs opacity-60">
                                <span>#{order.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-white/5 pt-4 mt-1">
                        <div className="flex items-center">
                            {(order.shipping_name || order.shipping_city) && (
                                <div className="text-sm text-[#9ca3af] flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                        {order.shipping_city && order.shipping_country
                                            ? `${order.shipping_city}, ${order.shipping_country}`
                                            : order.shipping_name || 'Shipping address'
                                        }
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {canCancel && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    disabled={isPending}
                                    className="h-7 text-xs px-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                                >
                                    {isPending ? 'Requesting...' : 'Request Cancel'}
                                </Button>
                            )}

                            {order.tracking_url && (
                                <a
                                    href={order.tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
                                >
                                    <Truck className="w-3.5 h-3.5" />
                                    Track Package
                                </a>
                            )}
                            <Badge variant="outline" className={`${getStatusColor(order.status)} border whitespace-nowrap`}>
                                <div className="flex items-center">
                                    {getStatusIcon(order.status)}
                                    <span className="font-medium">{getStatusText(order.status)}</span>
                                </div>
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function OrdersList({ orders }: OrdersListProps) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No orders yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">When you place an order, it will appear here.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md pr-4">
            <div className="space-y-4 pb-4">
                {orders.map((order) => (
                    <OrderItem key={order.id} order={order} />
                ))}
            </div>
        </ScrollArea>
    );
}

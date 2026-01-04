'use client';

import { format } from 'date-fns';
import { Package, Truck, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'paid' | 'fulfilled' | 'failed';
    amount_total: number | null;
    shipping_name: string | null;
    shipping_city: string | null;
    shipping_country: string | null;
    quantity: number;
}

interface OrdersListProps {
    orders: Order[];
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'fulfilled': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'paid': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
            case 'failed': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'fulfilled': return <CheckCircle className="w-4 h-4 mr-1" />;
            case 'paid': return <Truck className="w-4 h-4 mr-1" />;
            case 'pending': return <Clock className="w-4 h-4 mr-1" />;
            case 'failed': return <AlertCircle className="w-4 h-4 mr-1" />;
            default: return <Package className="w-4 h-4 mr-1" />;
        }
    };

    return (
        <ScrollArea className="h-[600px] w-full rounded-md">
            <div className="space-y-4">
                {orders.map((order) => (
                    <Card key={order.id} className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                                        #{order.id.slice(0, 8)}
                                    </span>
                                    <Badge variant="outline" className={getStatusColor(order.status)}>
                                        <div className="flex items-center">
                                            {getStatusIcon(order.status)}
                                            <span className="capitalize">{order.status}</span>
                                        </div>
                                    </Badge>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Placed on {format(new Date(order.created_at), 'MMM d, yyyy')}
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</div>
                                    <div className="font-semibold">{order.quantity}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
                                    <div className="font-semibold">
                                        {order.amount_total
                                            ? `$${(order.amount_total / 100).toFixed(2)}`
                                            : '-'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(order.shipping_name || order.shipping_city) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    <span>
                                        Shipping to <span className="font-medium">{order.shipping_name}</span>
                                        {order.shipping_city && order.shipping_country && (
                                            <> in {order.shipping_city}, {order.shipping_country}</>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
}

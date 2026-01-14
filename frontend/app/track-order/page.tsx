'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
    id: string;
    created_at: string;
    status: string;
    amount_total: number;
    shipping_name: string;
    shipping_city: string;
    shipping_country: string;
    mockup_url: string | null;
    tracking_url: string | null;
    tracking_number: string | null;
}

export default function TrackOrderPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<{ orderId: string, email: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);

    const onSubmit = async (data: { orderId: string, email: string }) => {
        setIsLoading(true);
        setOrder(null);
        try {
            const res = await fetch('/api/order-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to find order');
            }

            const resData = await res.json();
            setOrder(resData.order);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-12 px-4 mx-auto min-h-[60vh] flex flex-col justify-center">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
                <p className="text-muted-foreground">Enter your Order ID and Email to view status</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>View current status and shipping info</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="orderId">Order ID</Label>
                                <Input
                                    id="orderId"
                                    placeholder="e.g. 523..."
                                    {...register("orderId", { required: "Order ID is required" })}
                                />
                                {errors.orderId && <p className="text-red-500 text-xs">{errors.orderId.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    {...register("email", { required: "Email is required" })}
                                />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Track Order
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {order && (
                <Card className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                                <CardDescription>Placed on {format(new Date(order.created_at), 'PPP')}</CardDescription>
                            </div>
                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                                {order.status.replace(/_/g, ' ')}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4">
                            {order.mockup_url && (
                                <div className="w-24 h-32 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border">
                                    <img src={order.mockup_url} alt="Print Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 space-y-1">
                                <p className="font-medium">Framed Map Print</p>
                                <p className="text-sm text-muted-foreground">Total: ${(order.amount_total / 100).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-50 p-4 rounded-md justify-between items-center border mb-4">
                            <div>
                                <p className="text-sm font-medium">Tracking Status</p>
                                <p className="text-muted-foreground text-sm">
                                    {order.tracking_number ? `Number: ${order.tracking_number}` : 'Processing'}
                                </p>
                            </div>
                            {order.tracking_url && (
                                <Button asChild size="sm" variant="outline">
                                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                                        Track Package
                                    </a>
                                </Button>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Shipping To</h4>
                            <p className="text-sm text-muted-foreground">
                                {order.shipping_name}<br />
                                {order.shipping_city}, {order.shipping_country}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

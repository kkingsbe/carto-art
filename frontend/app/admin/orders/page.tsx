'use client';

import { useState, useEffect } from "react";
import { getAdminOrders, syncOrderStatuses } from "@/lib/actions/ecommerce";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, ExternalLink, Activity } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getAdminOrders();
            setOrders(data);
        } catch (error) {
            toast.error("Failed to fetch orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        toast.info("Syncing order statuses with Printful...");
        try {
            const result = await syncOrderStatuses();
            toast.success(`Synced ${result.synced} orders`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to sync orders");
        } finally {
            setIsSyncing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            case 'paid':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Paid / Processing</Badge>;
            case 'fulfilled':
                return <Badge className="bg-green-500 hover:bg-green-600">Fulfilled</Badge>;
            case 'failed':
            case 'paid_fulfillment_failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-muted-foreground">View and sync customer orders.</p>
                </div>
                <Button onClick={handleSync} disabled={isSyncing || isLoading}>
                    {isSyncing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync Status
                </Button>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">External</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {order.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{order.user?.display_name || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">@{order.user?.username || 'user'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        ${((order.amount_total || 0) / 100).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {order.printful_order_id ? (
                                            <a
                                                href={`https://www.printful.com/dashboard/default/orders?id=${order.printful_order_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-500 hover:text-blue-700 hover:underline text-sm font-medium"
                                            >
                                                View in Printful
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Not synced</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

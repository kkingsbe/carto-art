import { getTicketDetails } from "@/lib/actions/tickets";
import { TicketChat } from "./ticket-chat";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdminTicketPage({ params }: { params: { id: string } }) {
    const { ticket, messages } = await getTicketDetails(params.id);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/tickets">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {ticket.subject}
                            <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                                {ticket.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">{ticket.customer_email}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-card border rounded-md overflow-hidden flex flex-col">
                <TicketChat ticketId={ticket.id} initialMessages={messages} />
            </div>
        </div>
    );
}

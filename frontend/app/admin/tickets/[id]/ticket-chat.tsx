'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToTicket } from "@/lib/actions/tickets";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    sender_role: 'customer' | 'agent';
    created_at: string;
}

interface TicketChatProps {
    ticketId: string;
    initialMessages: Message[];
}

export function TicketChat({ ticketId, initialMessages }: TicketChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom on mount and new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!replyText.trim()) return;

        setIsSending(true);
        try {
            // Optimistic update? No, let's wait for server action to confirm
            // Actually, for better UX with server actions, we usually assume success or wait. 
            // We'll wait here as email sending is critical.

            await replyToTicket(ticketId, replyText);

            toast.success("Reply sent");
            setReplyText("");

            // Since we revalidated path in action, the page might reload or we need to rely on the props updating?
            // In a client component, props update if the parent re-renders. 
            // But Next.js Server Actions + router.refresh() (if called) would update this. 
            // The action `replyToTicket` calls `revalidatePath`. 
            // HOWEVER, `initialMessages` prop won't update unless the parent Server Component re-renders. 
            // Next.js handles this automatically if `revalidatePath` was called for this page.
            // BUT, optimistic update is nicer.

            // Let's assume the server action works and optimistically add it, 
            // OR trigger a router refresh if the prop doesn't update automatically.
            // Actually, revalidatePath on the page should trigger a refresh of the server component payload.

            // Let's add it optimistically or wait for the refresh?
            // We will just append to local state to be improved responsiveness.

            setMessages(prev => [...prev, {
                id: 'temp-' + Date.now(),
                content: replyText,
                sender_role: 'agent',
                created_at: new Date().toISOString()
            }]);

        } catch (error) {
            toast.error("Failed to send reply");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex flex-col max-w-[80%] rounded-lg p-3 text-sm",
                            msg.sender_role === 'agent'
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "mr-auto bg-muted"
                        )}
                    >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <span className="text-[10px] opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                        </span>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10">No messages yet.</div>
                )}
            </div>

            <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="resize-none min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !replyText.trim()}
                        className="h-auto"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

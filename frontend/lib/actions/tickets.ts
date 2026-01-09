'use server';

import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/email/client";
import { revalidatePath } from "next/cache";

export interface Ticket {
    id: string;
    subject: string;
    customer_email: string;
    status: 'open' | 'closed';
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    content: string;
    sender_role: 'customer' | 'agent';
    message_id: string | null;
    created_at: string;
}

export async function getTickets(): Promise<Ticket[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('tickets' as any)
        .select('*')
        .order('last_message_at', { ascending: false });

    if (error) {
        console.error('Error fetching tickets:', error);
        throw new Error('Failed to fetch tickets');
    }

    return (data || []) as Ticket[];
}

export async function getTicketDetails(id: string): Promise<{ ticket: Ticket, messages: TicketMessage[] }> {
    const supabase = createAdminClient();

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets' as any)
        .select('*')
        .eq('id', id)
        .single();

    if (ticketError) throw new Error('Failed to fetch ticket');

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
        .from('ticket_messages' as any)
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

    if (messagesError) throw new Error('Failed to fetch messages');

    return { ticket: ticket as Ticket, messages: (messages || []) as TicketMessage[] };
}

export async function replyToTicket(ticketId: string, content: string) {
    const supabase = createAdminClient();

    // 1. Get ticket info for email destination
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets' as any)
        .select('*')
        .eq('id', ticketId)
        .single();

    if (ticketError || !ticket) throw new Error('Ticket not found');

    // 2. Insert Agent Message
    const { error: insertError } = await supabase
        .from('ticket_messages' as any)
        .insert({
            ticket_id: ticketId,
            content,
            sender_role: 'agent'
        });

    if (insertError) throw new Error('Failed to save reply');

    // 3. Send Email via Resend
    try {
        // Ensure subject has the ticket ID for threading
        // Check if subject already has [Ticket: ID] to avoid duplication (though webhook handles it, better UI experience)
        let subject = ticket.subject;
        if (!subject.includes(`[Ticket: ${ticket.id}]`)) {
            subject = `[Ticket: ${ticket.id}] ${subject}`;
        } else {
            subject = `Re: ${subject}`;
        }

        await resend.emails.send({
            from: EMAIL_FROM,
            to: ticket.customer_email,
            subject: subject,
            text: content,
            // html: `<p>${content}</p>` // Optional: rich text
        });
    } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Note: We might want to flag the message as "failed to send" in DB if critical, 
        // but for now we throw so the UI knows.
        throw new Error('Failed to send email');
    }

    // 4. Update ticket timestamp
    await supabase
        .from('tickets' as any)
        .update({
            last_message_at: new Date().toISOString(),
            status: 'open' // ensure open
        })
        .eq('id', ticketId);

    revalidatePath('/admin/tickets');
    revalidatePath(`/admin/tickets/${ticketId}`);

    return { success: true };
}

export async function closeTicket(ticketId: string) {
    const supabase = createAdminClient();
    await supabase
        .from('tickets' as any)
        .update({ status: 'closed' })
        .eq('id', ticketId);

    revalidatePath('/admin/tickets');
    revalidatePath(`/admin/tickets/${ticketId}`);
}

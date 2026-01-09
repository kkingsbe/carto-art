import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // Basic validation
        if (!payload.from || !payload.subject) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = createAdminClient() as any;

        // Extract sender email
        // Resend 'from' field is usually "Name <email>" or just "email"
        const fromStr = payload.from;
        const emailMatch = fromStr.match(/<(.+)>/);
        const customerEmail = emailMatch ? emailMatch[1] : fromStr;

        const subject = payload.subject;
        const text = payload.text || '';
        const html = payload.html || '';

        // Try to find existing ticket ID in subject
        // Pattern: [Ticket: <UUID>]
        const ticketIdMatch = subject.match(/\[Ticket: ([0-9a-fA-F-]+)\]/);
        let ticketId = ticketIdMatch ? ticketIdMatch[1] : null;
        let isNewTicket = false;

        if (ticketId) {
            // Verify ticket exists
            const { data: existingTicket } = await supabase
                .from('tickets')
                .select('id')
                .eq('id', ticketId)
                .single();

            if (!existingTicket) {
                ticketId = null; // Valid ID format but not found, treat as new
            }
        }

        if (!ticketId) {
            // Create new ticket

            // Check if there is an open ticket for this user? 
            // Optional: Logic to group by user. For now, strictly subject-based threading or new ticket.

            const { data: newTicket, error: createError } = await supabase
                .from('tickets')
                .insert({
                    subject: subject,
                    customer_email: customerEmail,
                    status: 'open', // Default
                } as any)
                .select('id')
                .single();

            if (createError) {
                console.error('Error creating ticket:', createError);
                return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
            }

            ticketId = newTicket.id;
            isNewTicket = true;
        } else {
            // Re-open ticket if it was closed?
            await supabase
                .from('tickets')
                .update({
                    status: 'open',
                    updated_at: new Date().toISOString(),
                    last_message_at: new Date().toISOString()
                })
                .eq('id', ticketId);
        }

        // Add message to ticket
        const { error: messageError } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticketId,
                content: text || 'No text content', // Prefer text for now, maybe store HTML later or in a separate column if needed
                sender_role: 'customer',
                message_id: payload.message_id || null // Store Resend/Email Message-ID if available
            } as any);

        if (messageError) {
            console.error('Error adding message:', messageError);
            return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
        }

        return NextResponse.json({ success: true, ticketId, isNew: isNewTicket });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

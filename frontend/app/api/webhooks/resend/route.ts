import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);

        console.log('[Resend Webhook] Payload received:', JSON.stringify(payload, null, 2));

        // Resend webhooks often wrap the actual email data in a 'data' object
        const data = payload.data || payload;

        // Basic validation
        if (!data.from || !data.subject) {
            console.error('[Resend Webhook] Invalid payload: Missing from or subject', data);
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = createAdminClient() as any;

        // Extract sender email
        // Resend 'from' field is usually "Name <email>" or just "email"
        const fromStr = data.from;
        const emailMatch = fromStr.match(/<(.+)>/);
        const customerEmail = emailMatch ? emailMatch[1] : fromStr;

        const subject = data.subject;
        const text = data.text || '';
        const html = data.html || '';

        console.log(`[Resend Webhook] Processing email from ${customerEmail} - Subject: ${subject}`);

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
                console.warn(`[Resend Webhook] Ticket ID ${ticketId} found in subject but not in DB.`);
                ticketId = null; // Valid ID format but not found, treat as new
            } else {
                console.log(`[Resend Webhook] Linked to existing ticket: ${ticketId}`);
            }
        }

        if (!ticketId) {
            // Create new ticket
            console.log('[Resend Webhook] Creating new ticket...');

            // Optional: Check if it's a reply to an Order Confirmation
            // Subject: "Re: Order Confirmed - Carto-Art #BEADE35F"
            // We could parse the Order ID, but for now, just creating a ticket with this subject is fine.

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
                console.error('[Resend Webhook] Error creating ticket:', createError);
                return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
            }

            ticketId = newTicket.id;
            isNewTicket = true;
            console.log(`[Resend Webhook] Created new ticket: ${ticketId}`);
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
                content: text || 'No text content', // Prefer text for now
                sender_role: 'customer',
                message_id: data.message_id || null // Store Resend/Email Message-ID if available
            } as any);

        if (messageError) {
            console.error('[Resend Webhook] Error adding message:', messageError);
            return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
        }

        return NextResponse.json({ success: true, ticketId, isNew: isNewTicket });
    } catch (error: any) {
        console.error('[Resend Webhook] Processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

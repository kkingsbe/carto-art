create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  customer_email text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  content text not null,
  sender_role text not null check (sender_role in ('customer', 'agent')),
  message_id text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Policies (Assuming admins have a way to be identified, for now we might be permissive or check for admin role if it exists in profiles, but typically these apps are single tenant or we need to be careful. 
-- For this MVP, we will allow authenticated users (admins) to do everything and maybe restrict public access if possible, but webhooks need access)

-- Allow public (webhook) to insert? No, webhook runs server-side with service role.
-- Allow admins to read/write.
-- For now, let's just create basic policies for authenticated users if we have an admin role, otherwise open for authenticated for simplicity in this step, but assuming service role for backend logic.

create policy "Admins can view all tickets"
  on public.tickets for select
  to authenticated
  using (true); 

create policy "Admins can update tickets"
  on public.tickets for update
  to authenticated
  using (true);

create policy "Admins can view messages"
  on public.ticket_messages for select
  to authenticated
  using (true);

create policy "Admins can insert messages"
  on public.ticket_messages for insert
  to authenticated
  with check (true);

-- Indexes
create index idx_tickets_status on public.tickets(status);
create index idx_tickets_customer_email on public.tickets(customer_email);
create index idx_ticket_messages_ticket_id on public.ticket_messages(ticket_id);

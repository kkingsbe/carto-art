create type order_status as enum ('pending', 'paid', 'fulfilled', 'failed');

create table public.orders (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  
  -- Product Details
  design_id text not null, -- ID of the design image (Printful file ID or internal URL)
  variant_id integer not null, -- Printful Variant ID
  quantity integer not null default 1,
  
  -- Payment Details
  stripe_payment_intent_id text unique,
  stripe_payment_status text,
  amount_total integer, -- in cents
  
  -- Fulfillment Details
  printful_order_id integer unique,
  status order_status not null default 'pending',
  shipping_name text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  shipping_country text,
  
  constraint orders_pkey primary key (id)
);

-- RLS Policies
alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Service role can manage all orders"
  on public.orders
  for all
  to service_role
  using (true)
  with check (true);

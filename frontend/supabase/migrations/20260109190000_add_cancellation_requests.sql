
create table public.order_cancellations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  status text not null default 'pending', -- pending, approved, rejected
  
  -- Progress tracking
  refund_issued boolean not null default false,
  printful_cancelled boolean not null default false,
  
  constraint order_cancellations_pkey primary key (id),
  constraint unique_active_cancellation unique (order_id) 
);

-- RLS Policies
alter table public.order_cancellations enable row level security;

create policy "Users can view their own cancellations"
  on public.order_cancellations
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own cancellations"
  on public.order_cancellations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can manage all cancellations"
  on public.order_cancellations
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

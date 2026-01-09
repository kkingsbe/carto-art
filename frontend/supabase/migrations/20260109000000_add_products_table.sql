-- Create products table
create table if not exists products (
    id bigint primary key, -- Explicitly matches Printful Product ID (or whatever is in variants.product_id)
    title text not null,
    description text,
    features text[],
    starting_price integer, -- In cents
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Trigger for updated_at
create trigger update_products_updated_at
    before update on products
    for each row
    execute procedure update_updated_at_column();

-- RLS
alter table products enable row level security;

create policy "Allow public read-only access to active products"
    on products for select
    using (is_active = true);

create policy "Allow admins full access"
    on products
    to authenticated
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    )
    with check (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );

-- Seed data
-- Using standard Printful IDs: 1 (Poster), 54 (Framed Poster), 30 (Canvas)
-- These match the heuristics in store.ts
insert into products (id, title, description, features, starting_price, display_order)
values
    (54, 'Framed Poster', 'Museum-quality matte paper, framed in semi-hardwood timber.', array['Ayous wood frame', 'Acrylite front protector', 'Hanging hardware included'], 4500, 1),
    (30, 'Canvas Print', 'Textured, fade-resistant canvas mounting brackets included.', array['Acid-free, PH-neutral, poly-cotton base', '20.5 mil thick poly-cotton blend canvas', 'Hand-glued solid wood stretcher bars'], 5500, 2),
    (1, 'Art Poster', 'Museum-quality posters made on thick and durable matte paper.', array['Paper thickness: 10.3 mil', 'Paper weight: 5.57 oz/y² (189 g/m²)', 'Giclée printing quality'], 2500, 3)
on conflict (id) do nothing;

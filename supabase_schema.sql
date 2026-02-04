-- Create Menu Items Table
create table menu_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price text not null,
  category text not null,
  tag text,
  highlight boolean default false,
  is_available boolean default true,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Variants Table (for sizes)
create table menu_variants (
  id uuid default gen_random_uuid() primary key,
  menu_item_id uuid references menu_items(id) on delete cascade,
  name text not null, -- e.g. "Small", "Medium"
  price text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Orders Table
create table orders (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_phone text not null,
  address text, -- Made nullable for Dine-in/POS
  gps_location text,
  total_amount numeric not null,
  status text default 'Pending', -- Pending, Preparing, Out for Delivery, Delivered, Cancelled
  order_type text default 'Delivery', -- Delivery, Dine-in, Counter
  table_id uuid references res_tables(id), -- Added table relation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Order Items Table
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_name text not null,
  variant_name text,
  price numeric not null,
  quantity integer not null,
  subtotal numeric not null
);

-- Create Reservations Table
create table reservations (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_phone text not null,
  guest_count integer not null,
  reservation_date date not null,
  reservation_time time not null,
  status text default 'Pending', -- Pending, Confirmed, Cancelled
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Restaurant Tables Table
create table res_tables (
  id uuid default gen_random_uuid() primary key,
  table_number text not null unique,
  capacity integer default 4,
  status text default 'Available', -- Available, Occupied, Reserved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table menu_items enable row level security;
alter table menu_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reservations enable row level security;
alter table res_tables enable row level security;

-- Policies (Public Read, Admin Write)
-- For simplicity in this demo, we allow anon read/write for now. 
-- In production, you would lock down 'orders' write to anon, read to admin only.

create policy "Enable read access for all users" on menu_items for select using (true);
create policy "Enable read access for all users" on menu_variants for select using (true);
create policy "Enable insert for all users" on orders for insert with check (true);
create policy "Enable insert for all users" on order_items for insert with check (true);
create policy "Enable read access for all users" on reservations for select using (true);
create policy "Enable insert for all users" on reservations for insert with check (true);
create policy "Enable update for all users" on reservations for update using (true);
create policy "Enable delete for all users" on reservations for delete using (true);

-- Allow full access for now (Simplifies Admin Panel dev without Auth setup yet)
create policy "Enable full access for all users" on menu_items for all using (true);
create policy "Enable full access for all users" on menu_variants for all using (true);
create policy "Enable full access for all users" on orders for all using (true);
create policy "Enable full access for all users" on order_items for all using (true);
create policy "Enable full access for all users" on res_tables for all using (true);

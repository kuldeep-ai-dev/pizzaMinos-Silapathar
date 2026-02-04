-- ⚠️ WARNING: THIS WILL DELETE ALL EXISTING ORDERS AND MENU ITEMS ⚠️
-- Run this in Supabase SQL Editor to reset and seed your database.

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "Enable read access for all users" on menu_items;
drop policy if exists "Enable read access for all users" on menu_variants;
drop policy if exists "Enable insert for all users" on orders;
drop policy if exists "Enable insert for all users" on order_items;
drop policy if exists "Enable full access for all users" on menu_items;
drop policy if exists "Enable full access for all users" on menu_variants;
drop policy if exists "Enable full access for all users" on orders;
drop policy if exists "Enable full access for all users" on order_items;

-- 2. Drop existing tables
drop table if exists order_items;
drop table if exists orders;
drop table if exists res_tables;
drop table if exists menu_variants;
drop table if exists menu_items;
drop table if exists reservations;

-- 3. Re-create Tables
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

create table menu_variants (
  id uuid default gen_random_uuid() primary key,
  menu_item_id uuid references menu_items(id) on delete cascade,
  name text not null,
  price text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table orders (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_phone text not null,
  address text, -- Made nullable for Dine-in/POS
  gps_location text,
  total_amount numeric not null,
  status text default 'Pending',
  order_type text default 'Delivery', -- Delivery, Dine-in, Counter
  table_id uuid, -- Link to table
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_name text not null,
  variant_name text,
  price numeric not null,
  quantity integer not null,
  subtotal numeric not null
);

-- 3.5 Create Reservations Table
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

-- 3.6 Create Restaurant Tables Table
create table res_tables (
  id uuid default gen_random_uuid() primary key,
  table_number text not null unique,
  capacity integer default 4,
  status text default 'Available', -- Available, Occupied, Reserved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table menu_items enable row level security;
alter table menu_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reservations enable row level security;
alter table res_tables enable row level security;

-- 5. Create Permissions (Allow All for Demo)
create policy "Allow All Menu" on menu_items for all using (true);
create policy "Allow All Variants" on menu_variants for all using (true);
create policy "Allow All Orders" on orders for all using (true);
create policy "Allow All Order Items" on order_items for all using (true);
create policy "Allow All Reservations" on reservations for all using (true);
create policy "Allow All Tables" on res_tables for all using (true);

-- 6. SEED DATA (Insert Menu Items)
-- Variable storage for IDs
DO $$
DECLARE
  v_pizza_id uuid;
BEGIN
  -- VEG PIZZAS
  insert into menu_items (name, description, price, category, tag, highlight)
  values ('Cheese Pizza (Margherita)', 'Three types of cheese.', '₹109', 'Veg Pizza', 'Classic', false)
  returning id into v_pizza_id;

  -- Seed Reservations
  INSERT INTO reservations (customer_name, customer_phone, guest_count, reservation_date, reservation_time, status)
  VALUES
  ('John Doe', '9876543210', 4, CURRENT_DATE + INTERVAL '1 day', '19:00:00', 'Confirmed'),
  ('Jane Smith', '9123456789', 2, CURRENT_DATE + INTERVAL '2 days', '20:30:00', 'Pending');

  insert into menu_variants (menu_item_id, name, price) values
  (v_pizza_id, 'Small', '₹109'), (v_pizza_id, 'Medium', '₹169'), (v_pizza_id, 'Large', '₹259');

  insert into menu_items (name, description, price, category, tag, highlight)
  values ('Corn Delight', 'Sweet corn, baby corn & capsicum.', '₹159', 'Veg Pizza', null, false)
  returning id into v_pizza_id;

  insert into menu_variants (menu_item_id, name, price) values
  (v_pizza_id, 'Small', '₹159'), (v_pizza_id, 'Medium', '₹209'), (v_pizza_id, 'Large', '₹299');

  insert into menu_items (name, description, price, category, tag, highlight)
  values ('Tikka Paneer', 'Tikka cubes and toppings.', '₹179', 'Veg Pizza', null, true)
  returning id into v_pizza_id;

  insert into menu_variants (menu_item_id, name, price) values
  (v_pizza_id, 'Small', '₹179'), (v_pizza_id, 'Medium', '₹249'), (v_pizza_id, 'Large', '₹359');

  -- CHICKEN PIZZAS
  insert into menu_items (name, description, price, category, tag, highlight)
  values ('Chicken and Cheese', 'Tikka Chicken, Three types of cheese.', '₹169', 'Chicken Pizza', null, false)
  returning id into v_pizza_id;

  insert into menu_variants (menu_item_id, name, price) values
  (v_pizza_id, 'Small', '₹169'), (v_pizza_id, 'Medium', '₹229'), (v_pizza_id, 'Large', '₹309');

  insert into menu_items (name, description, price, category, tag, highlight)
  values ('Chicken Pepperoni', 'Pepperoni slices & Three types of cheese.', '₹179', 'Chicken Pizza', 'Bestseller', false)
  returning id into v_pizza_id;

  insert into menu_variants (menu_item_id, name, price) values
  (v_pizza_id, 'Small', '₹179'), (v_pizza_id, 'Medium', '₹239'), (v_pizza_id, 'Large', '₹339');

  -- BURGERS
  insert into menu_items (name, price, category) values ('Veg Burger', '₹99', 'Burgers');
  insert into menu_items (name, price, category) values ('Zinger Burger', '₹149', 'Burgers');
  insert into menu_items (name, price, category, tag) values ('Chicken Zing Burger', '₹179', 'Burgers', 'Must Try');

  -- DRINKS
  insert into menu_items (name, price, category) values ('Cold Coffee', '₹89', 'Drinks');
  insert into menu_items (name, price, category, tag) values ('Oreo Shake', '₹109', 'Drinks', 'Sweet');

  -- SIDES
  insert into menu_items (name, price, category) values ('French Fries', '₹89', 'Sides');
  
END $$;

-- Enable Row Level Security
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table menu_variants enable row level security;
alter table campaigns enable row level security;

-- Drop existing policies if they exist (to prevent conflicts)
drop policy if exists "Enable read access for all users" on menu_categories;
drop policy if exists "Enable read access for all users" on menu_items;
drop policy if exists "Enable read access for all users" on menu_variants;
drop policy if exists "Enable read access for all users" on campaigns;

-- Recreate policies for PUBLIC (Anonymous) read access
create policy "Enable read access for all users" on menu_categories for select using (true);
create policy "Enable read access for all users" on menu_items for select using (true);
create policy "Enable read access for all users" on menu_variants for select using (true);
create policy "Enable read access for all users" on campaigns for select using (true);

-- Ensure full access is granted for admins (optional safety net)
drop policy if exists "Enable full access for all users" on menu_categories;
create policy "Enable full access for all users" on menu_categories for all using (true);

-- Ensure correct permissions on orders for guest checkout
drop policy if exists "Enable insert for all users" on orders;
create policy "Enable insert for all users" on orders for insert with check (true);
drop policy if exists "Enable insert for all users" on order_items;
create policy "Enable insert for all users" on order_items for insert with check (true);

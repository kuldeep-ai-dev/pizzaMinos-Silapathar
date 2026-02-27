import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Menu from "@/components/sections/Menu";
import Reservation from "@/components/sections/Reservation";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Fetch data on the server to bypass any client-side ISP blocks
  const [categoriesRes, itemsRes, variantsRes, campaignsRes] = await Promise.all([
    supabase.from("menu_categories").select("*").order("name"),
    supabase.from("menu_items").select("*").eq("is_available", true),
    supabase.from("menu_variants").select("*"),
    supabase.from("campaigns").select("*").eq("is_active", true)
  ]);

  const categories = categoriesRes.data || [];
  const menuData = itemsRes.data || [];
  const variantsData = variantsRes.data || [];
  const activeCampaigns = campaignsRes.data || [];

  // Merge variants into items
  const items = menuData.map((item: any) => ({
    ...item,
    variants: variantsData.filter((v: any) => v.menu_item_id === item.id) || []
  }));

  return (
    <main className="min-h-screen bg-[var(--color-dark-bg)] text-white selection:bg-[var(--color-pizza-red)] selection:text-white overflow-x-hidden">
      <Hero />
      <Menu initialCategories={categories} initialItems={items} initialCampaigns={activeCampaigns} />
      <Reservation />
      <Footer />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Pizza, Coffee, Sandwich, Drumstick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/utils/supabase/client";

// Define categories
type Category = "Veg Pizza" | "Chicken Pizza" | "Burgers" | "Drinks" | "Sides";

interface Variant {
    name: string;
    price: string;
}

interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: string; // Base price or display price if no variants
    category: Category;
    tag?: string;
    highlight?: boolean;
    image_url?: string;
    variants?: Variant[];
}

const categories: { id: Category; label: string; icon: any }[] = [
    { id: "Veg Pizza", label: "Veg Pizza", icon: Pizza },
    { id: "Chicken Pizza", label: "Chicken Pizza", icon: Pizza },
    { id: "Burgers", label: "Burgers", icon: Sandwich },
    { id: "Sides", label: "Sides & Wings", icon: Drumstick },
    { id: "Drinks", label: "Drinks", icon: Coffee },
];

const MenuItemCard = ({ item, activeCampaigns }: { item: MenuItem; activeCampaigns: any[] }) => {
    const { addItem } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(item.variants && item.variants.length > 0 ? item.variants[0] : null);

    const price = selectedVariant ? selectedVariant.price : item.price;
    const { original, discounted, appliedCampaign } = calculateDiscountedPrice(price, { id: item.id, category: item.category }, activeCampaigns);

    const displayPrice = `₹${discounted}`;
    const hasDiscount = Number(original) !== Number(discounted);

    return (
        <Card className="h-full flex flex-row md:flex-col hover:border-[var(--color-pizza-red)]/50 transition-all duration-500 group border-white/5 bg-[var(--color-card-bg)] overflow-hidden rounded-2xl shadow-xl">
            {/* Image Section */}
            <div className="w-[35%] md:w-full aspect-square md:aspect-[16/9] relative overflow-hidden bg-black/40 flex-shrink-0">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Pizza className="text-white/10 w-8 md:w-12 h-8 md:h-12" />
                    </div>
                )}

                {(item.tag || appliedCampaign) && (
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex flex-col gap-1">
                        {item.tag && (
                            <span className={cn(
                                "text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full text-white uppercase tracking-widest shadow-lg",
                                item.tag.toLowerCase().includes('best') ? "bg-yellow-500 text-black border border-yellow-400" :
                                    item.tag.toLowerCase().includes('spicy') ? "bg-red-600 border border-red-500" :
                                        "bg-white/10 backdrop-blur-md border border-white/20"
                            )}>
                                {item.tag}
                            </span>
                        )}
                        {appliedCampaign && (
                            <span className="text-[8px] md:text-[9px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-green-500 text-white uppercase tracking-widest shadow-lg border border-green-400 animate-pulse">
                                {appliedCampaign.type === 'percentage' ? `${appliedCampaign.discount_value}% OFF` : `₹${appliedCampaign.discount_value} OFF`}
                            </span>
                        )}
                    </div>
                )}

                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-black/80 backdrop-blur-md text-white px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl flex flex-col items-end border border-white/10 shadow-2xl">
                    {hasDiscount && (
                        <span className="text-[8px] md:text-xs text-gray-400 line-through decoration-[var(--color-pizza-red)]">₹{original}</span>
                    )}
                    <span className="text-[10px] md:text-lg font-black tracking-tighter">
                        {displayPrice}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-3 md:p-6 min-w-0">
                <CardHeader className="p-0 mb-3 md:mb-6">
                    <CardTitle className="text-sm md:text-xl font-bold text-white group-hover:text-[var(--color-pizza-red)] transition-colors tracking-tight line-clamp-1">
                        {item.name}
                    </CardTitle>
                    {item.description && (
                        <CardDescription className="text-gray-400 mt-1 line-clamp-2 text-[10px] md:text-sm font-medium leading-relaxed">
                            {item.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardFooter className="mt-auto p-0 flex flex-col gap-3 md:gap-4">
                    {/* Size Selector */}
                    {item.variants && item.variants.length > 0 && (
                        <div className="grid grid-cols-3 gap-1 w-full bg-black/20 p-1 rounded-lg md:rounded-xl border border-white/5">
                            {item.variants.map((variant) => (
                                <button
                                    key={variant.name}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={cn(
                                        "text-[8px] md:text-[10px] py-1.5 md:py-2 rounded-md md:rounded-lg transition-all font-black uppercase tracking-widest",
                                        selectedVariant?.name === variant.name
                                            ? "bg-[var(--color-pizza-red)] text-white shadow-lg shadow-[var(--color-pizza-red)]/20"
                                            : "text-gray-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {variant.name.charAt(0)}
                                </button>
                            ))}
                        </div>
                    )}

                    <Button
                        onClick={() => addItem({
                            menuItemId: item.id,
                            name: item.name,
                            price: discounted.toString(),
                            basePrice: original.toString(),
                            category: item.category,
                            variant: selectedVariant?.name
                        })}
                        className="w-full h-8 md:h-12 gap-1 md:gap-3 group-hover:bg-[var(--color-pizza-red)] bg-white/5 text-white border border-white/10 hover:border-[var(--color-pizza-red)]/50 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] items-center justify-center transition-all active:scale-[0.98] rounded-lg md:rounded-xl px-2"
                        variant="ghost"
                    >
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Add <span className="hidden md:inline">to Box</span></span>
                    </Button>
                </CardFooter>
            </div>
        </Card>
    );
};

import { calculateDiscountedPrice } from "@/utils/pricing";

// ... existing types ...

const Menu = ({ compact = false }: { compact?: boolean }) => {
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchMenuData = async () => {
            setLoading(true);
            try {
                // Parallelized fetching for faster load
                const [categoriesRes, itemsRes, variantsRes, campaignsRes] = await Promise.all([
                    supabase.from("menu_categories").select("*").order("name"),
                    supabase.from("menu_items").select("*").eq("is_available", true),
                    supabase.from("menu_variants").select("*"),
                    supabase.from("campaigns").select("*").eq("is_active", true)
                ]);

                if (categoriesRes.error) throw categoriesRes.error;
                if (itemsRes.error) throw itemsRes.error;

                const catData = categoriesRes.data || [];
                setCategories(catData);
                if (catData.length > 0) setActiveCategory(catData[0].name);

                const menuData = itemsRes.data || [];
                const variantsData = variantsRes.data || [];
                const campaignsData = campaignsRes.data || [];

                setActiveCampaigns(campaignsData);

                // Merge variants into items
                const mergedItems = menuData.map((item: any) => ({
                    ...item,
                    variants: variantsData.filter((v: any) => v.menu_item_id === item.id) || []
                }));

                setItems(mergedItems);

                // Signal that data is ready for the splash screen
                if (typeof window !== "undefined") {
                    (window as any).__MENU_DATA_READY__ = true;
                    window.dispatchEvent(new Event("menuDataReady"));
                }
            } catch (error) {
                console.error("Error fetching menu data:", error);
                // Even on error, we should probably signal so the splash doesn't hang
                if (typeof window !== "undefined") {
                    (window as any).__MENU_DATA_READY__ = true;
                    window.dispatchEvent(new Event("menuDataReady"));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMenuData();
    }, []);

    const filteredItems = items.filter((item) => item.category === activeCategory);

    return (
        <section id="menu" className={cn(
            "bg-[var(--color-dark-bg)] relative",
            compact ? "py-8" : "py-24 min-h-screen"
        )}>
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[var(--color-pizza-red)]/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1 rounded-full bg-[var(--color-pizza-red)]/10 border border-[var(--color-pizza-red)]/20 mb-4"
                    >
                        <span className="text-[var(--color-pizza-red)] text-[10px] font-black uppercase tracking-[0.3em]">Fresh from the oven</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter"
                    >
                        Discover <span className="text-[var(--color-pizza-red)]">Flavors</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-xl mx-auto font-medium text-lg leading-relaxed">
                        Hand-crafted recipes using premium ingredients, delivered straight to your table.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-20">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.name)}
                            className={cn(
                                "flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 border",
                                activeCategory === cat.name
                                    ? "bg-[var(--color-pizza-red)] text-white border-[var(--color-pizza-red)] shadow-2xl shadow-[var(--color-pizza-red)]/30 scale-105"
                                    : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-[400px] rounded-2xl bg-white/5 border border-white/10 animate-pulse flex flex-col overflow-hidden">
                                <div className="aspect-[16/9] bg-white/5" />
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-white/5 rounded w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                    <div className="mt-auto h-10 bg-white/5 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.length === 0 ? (
                                <div className="col-span-full text-center py-20 flex flex-col items-center gap-4 opacity-30">
                                    <Pizza size={60} strokeWidth={1} />
                                    <p className="font-black uppercase tracking-widest text-sm">No items in this category yet</p>
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <MenuItemCard item={item as any} activeCampaigns={activeCampaigns} />
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Menu;

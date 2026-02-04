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
    variants?: Variant[];
}

const categories: { id: Category; label: string; icon: any }[] = [
    { id: "Veg Pizza", label: "Veg Pizza", icon: Pizza },
    { id: "Chicken Pizza", label: "Chicken Pizza", icon: Pizza },
    { id: "Burgers", label: "Burgers", icon: Sandwich },
    { id: "Sides", label: "Sides & Wings", icon: Drumstick },
    { id: "Drinks", label: "Drinks", icon: Coffee },
];

const MenuItemCard = ({ item }: { item: MenuItem }) => {
    const { addItem } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(item.variants && item.variants.length > 0 ? item.variants[0] : null);

    const currentPrice = selectedVariant ? selectedVariant.price : item.price;

    return (
        <Card className="h-full flex flex-col hover:border-[var(--color-pizza-red)]/50 transition-colors group border-white/5 bg-[var(--color-card-bg)]">
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    {item.tag ? (
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded text-white uppercase tracking-wider",
                            item.highlight ? "bg-yellow-500 text-black" : "bg-white/10"
                        )}>
                            {item.tag}
                        </span>
                    ) : <span />}
                    <span className="font-display text-xl text-[var(--color-pizza-red)] font-bold">
                        {currentPrice}
                    </span>
                </div>
                <CardTitle className="text-white group-hover:text-[var(--color-pizza-red)] transition-colors">
                    {item.name}
                </CardTitle>
                {item.description && (
                    <CardDescription className="text-gray-400 mt-2 line-clamp-2">
                        {item.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardFooter className="mt-auto pt-4 flex-col gap-3">
                {/* Size Selector */}
                {item.variants && item.variants.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 w-full bg-black/20 p-1 rounded-lg">
                        {item.variants.map((variant) => (
                            <button
                                key={variant.name}
                                onClick={() => setSelectedVariant(variant)}
                                className={cn(
                                    "text-xs py-1.5 rounded-md transition-all font-bold",
                                    selectedVariant?.name === variant.name
                                        ? "bg-[var(--color-pizza-red)] text-white shadow-md"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {variant.name === "Small" ? "S" : variant.name === "Medium" ? "M" : variant.name === "Large" ? "L" : variant.name}
                            </button>
                        ))}
                    </div>
                )}

                <Button
                    onClick={() => addItem({
                        menuItemId: item.id,
                        name: item.name,
                        price: currentPrice,
                        variant: selectedVariant?.name
                    })}
                    className="w-full gap-2 group-hover:bg-[var(--color-pizza-red)] bg-white/10 active:scale-95 transition-transform"
                    variant="secondary"
                >
                    <ShoppingCart className="w-4 h-4" /> Add {selectedVariant?.name && `(${selectedVariant.name.charAt(0)})`}
                </Button>
            </CardFooter>
        </Card>
    );
};

const Menu = () => {
    const [activeCategory, setActiveCategory] = useState<Category>("Veg Pizza");
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);

            // Fetch items
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            console.log("Supabase URL loaded:", supabaseUrl ? "YES" : "NO", supabaseUrl);

            const { data: menuData, error: menuError } = await supabase
                .from("menu_items")
                .select("*")
                .eq("is_available", true);

            if (menuError) {
                console.error("Error fetching menu:", JSON.stringify(menuError, null, 2));
                alert("Error fetching menu: " + (menuError.message || JSON.stringify(menuError)));
                setLoading(false);
                return;
            }

            // Fetch variants
            const { data: variantsData, error: variantsError } = await supabase
                .from("menu_variants")
                .select("*");

            if (variantsError) {
                console.error("Error fetching variants:", variantsError);
            }

            // Merge variants into items
            const mergedItems = menuData.map((item: any) => ({
                ...item,
                variants: variantsData?.filter((v: any) => v.menu_item_id === item.id) || []
            }));

            setItems(mergedItems);
            setLoading(false);
        };

        fetchMenu();
    }, []);

    const filteredItems = items.filter((item) => item.category === activeCategory);

    return (
        <section id="menu" className="py-20 bg-[var(--color-dark-bg)] relative min-h-screen">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-display font-bold text-white uppercase"
                    >
                        Our <span className="text-[var(--color-pizza-red)]">Menu</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Discover our wide variety of Pizzas, Burgers, and Beverages.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300",
                                activeCategory === cat.id
                                    ? "bg-[var(--color-pizza-red)] text-white shadow-lg shadow-[var(--color-pizza-red)]/20 scale-105"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <cat.icon size={18} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div className="flex justify-center py-20 text-[var(--color-pizza-red)]">
                        Loading Menu...
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredItems.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-gray-400">
                                    No items in this category yet.
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <MenuItemCard item={item} />
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default Menu;

"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Plus, Minus, ShoppingCart,
    Printer, Loader2, User,
    Table as TableIcon, Banknote,
    Pizza, Sandwich
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { calculateDiscountedPrice } from "@/utils/pricing";

interface MenuItem {
    id: string;
    name: string;
    price: string;
    category: string;
    variants?: any[];
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
}

export default function AdminPOSPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("Walk-in");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [priority, setPriority] = useState<"Normal" | "Rush">("Normal");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const [menuRes, tablesRes, categoriesRes, campaignsRes] = await Promise.all([
                supabase.from("menu_items").select("*, variants:menu_variants(*)"),
                supabase.from("res_tables").select("*").eq("status", "Available"),
                supabase.from("menu_categories").select("*").order("name"),
                supabase.from("campaigns").select("*").eq("is_active", true)
            ]);

            if (menuRes.data) setMenuItems(menuRes.data);
            if (tablesRes.data) setTables(tablesRes.data);
            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (campaignsRes.data) setActiveCampaigns(campaignsRes.data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === "All" || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, searchQuery, activeCategory]);

    const addToCart = (item: MenuItem, variant?: any) => {
        const itemId = variant ? `${item.id}-${variant.name}` : item.id;
        const priceStr = variant ? variant.price : item.price;

        // Calculate discounted price
        const { discounted } = calculateDiscountedPrice(priceStr, { id: item.id, category: item.category }, activeCampaigns);

        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: itemId,
                name: item.name,
                price: discounted as number,
                quantity: 1,
                variant: variant?.name
            }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                return { ...i, quantity: Math.max(0, i.quantity + delta) };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);

        const orderType = selectedTable === "Walk-in" ? "Counter" : "Dine-in";
        const tableId = selectedTable === "Walk-in" ? null : selectedTable;
        const tableNum = tables.find(t => t.id === tableId)?.table_number;

        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert([{
                customer_name: customerName || (orderType === "Counter" ? "Walk-in Customer" : `Table ${tableNum}`),
                customer_phone: customerPhone || "0000000000",
                address: orderType === "Counter" ? "Counter Sale" : `Dine-in: Table ${tableNum}`,
                total_amount: cartTotal,
                status: "Pending",
                order_type: orderType,
                table_id: tableId,
                notes: orderNotes,
                priority: priority
            }])
            .select()
            .single();

        if (orderError) {
            alert("Error: " + orderError.message);
            setIsSubmitting(false);
            return;
        }

        const orderItems = cart.map(i => ({
            order_id: orderData.id,
            menu_item_name: i.name,
            variant_name: i.variant,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity
        }));

        await supabase.from("order_items").insert(orderItems);

        // Reset
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setOrderNotes("");
        setPriority("Normal");
        setSelectedTable("Walk-in");
        setIsSubmitting(false);

        if (confirm("Order Placed! Open Invoice for printing?")) {
            window.open(`/admin/invoice/${orderData.id}`, "_blank");
        }
    };

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 flex gap-0">
                {/* Left: Product Selection */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <header className="mb-6 flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <Input
                                    placeholder="Search recipes..."
                                    className="pl-10 bg-black/40 border-white/10 text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                            <button
                                onClick={() => setActiveCategory("All")}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                    activeCategory === "All" ? 'bg-[var(--color-pizza-red)] text-white border-[var(--color-pizza-red)]' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                                )}
                            >
                                All Items
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                        activeCategory === cat.name ? 'bg-[var(--color-pizza-red)] text-white border-[var(--color-pizza-red)]' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10 pb-20">
                            {filteredItems.map(item => {
                                const { original, discounted, appliedCampaign } = calculateDiscountedPrice(item.price, { id: item.id, category: item.category }, activeCampaigns);
                                const hasDiscount = original !== discounted;

                                return (
                                    <motion.div
                                        key={item.id}
                                        whileTap={{ scale: 0.95 }}
                                        className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-[var(--color-pizza-red)]/50 transition-all duration-300 flex flex-col h-fit shadow-xl shadow-black/40"
                                    >
                                        <div className="aspect-[4/3] relative bg-black/40 overflow-hidden">
                                            {(item as any).image_url ? (
                                                <img
                                                    src={(item as any).image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/5">
                                                    {item.category.includes("Pizza") ? <Pizza size={40} /> : <Sandwich size={40} />}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                            {appliedCampaign && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest animate-pulse border border-green-400">
                                                    Offer
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <h3 className="text-[11px] font-black uppercase tracking-tight text-white mb-2 line-clamp-1">{item.name}</h3>

                                            {item.variants && item.variants.length > 0 ? (
                                                <div className="grid grid-cols-3 gap-1">
                                                    {item.variants.map(v => (
                                                        <button
                                                            key={v.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart(item, v);
                                                            }}
                                                            className="py-1 bg-white/5 hover:bg-[var(--color-pizza-red)] text-[9px] font-black rounded-lg text-gray-400 hover:text-white transition-all border border-white/5"
                                                        >
                                                            {v.name.charAt(0)}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        {hasDiscount && <span className="text-[8px] text-gray-500 line-through">₹{original}</span>}
                                                        <span className="text-[var(--color-pizza-red)] font-black text-xs">₹{discounted}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(item);
                                                        }}
                                                        className="h-7 w-7 p-0 bg-white/5 hover:bg-[var(--color-pizza-red)] rounded-lg transition-colors border border-white/10"
                                                    >
                                                        <Plus size={14} />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Cart & Order Info */}
                <div className="w-96 bg-black border-l border-white/10 flex flex-col p-6">
                    <div className="flex flex-col gap-4 mb-6">
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="text-[var(--color-pizza-red)]" /> Counter Cart
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Order Notes</label>
                                <Input
                                    placeholder="Extra spicy, no onions, etc."
                                    className="h-10 text-xs bg-white/5 border-white/10"
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Priority</label>
                                <div className="flex gap-2">
                                    {["Normal", "Rush"].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p as any)}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all",
                                                priority === p
                                                    ? p === "Rush" ? "bg-red-600 border-red-600 text-white" : "bg-white text-black border-white"
                                                    : "bg-white/5 text-gray-500 border-white/5"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Customer Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                    <Input
                                        placeholder="Guest Name"
                                        className="pl-9 h-10 text-xs bg-white/5 border-white/10"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Mobile Number</label>
                                <div className="relative">
                                    <Input
                                        type="tel"
                                        placeholder="10-digit phone"
                                        className="pl-4 h-10 text-xs bg-white/5 border-white/10"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Select Table</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setSelectedTable("Walk-in")}
                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedTable === "Walk-in" ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-500 border-white/5'
                                            }`}
                                    >
                                        WALK-IN
                                    </button>
                                    {tables.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTable(t.id)}
                                            className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedTable === t.id ? 'bg-[var(--color-pizza-red)] text-white border-[var(--color-pizza-red)]' : 'bg-white/5 text-gray-500 border-white/5'
                                                }`}
                                        >
                                            T-{t.table_number}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {cart.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                                        <p className="text-[10px] text-gray-500">{item.variant ? `${item.variant} • ` : ''}₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-black rounded-lg border border-white/10">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:text-white text-gray-600"><Minus size={12} /></button>
                                            <span className="text-xs font-bold min-w-[1.5rem] text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:text-white text-gray-600"><Plus size={12} /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm text-gray-400">Total Amount</span>
                            <span className="text-2xl font-display font-bold text-[var(--color-pizza-red)]">₹{cartTotal}</span>
                        </div>
                        <Button
                            onClick={handlePlaceOrder}
                            disabled={cart.length === 0 || isSubmitting}
                            className="w-full h-14 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-bold text-lg rounded-xl shadow-xl shadow-[var(--color-pizza-red)]/20 uppercase tracking-widest gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Banknote size={20} /> Place Order</>}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

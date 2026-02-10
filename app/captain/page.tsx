"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getStaffSession, logoutStaff, logStaffActivity } from "@/lib/auth-staff-actions";
import {
    LogOut,
    ChefHat,
    Package,
    Clock,
    MapPin,
    CheckCircle2,
    Truck,
    Utensils,
    User,
    RefreshCw,
    Loader2,
    Check,
    Search,
    Plus,
    Minus,
    ShoppingCart,
    ArrowLeft,
    X,
    Filter,
    Banknote,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    total_amount: number;
    status: string;
    order_type: string;
    table_id: string | null;
    created_at: string;
    assigned_staff_id?: string;
    items?: any[];
}

export default function CaptainDashboard() {
    const [staff, setStaff] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState<any | null>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"missions" | "tables" | "profile">("missions");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showIntro, setShowIntro] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const currentStaff = await getStaffSession();
            if (!currentStaff) {
                router.replace("/captain/login");
                return;
            }
            setStaff(currentStaff);
            fetchOrders(currentStaff);
            fetchTables();
            fetchMenu();

            // Start Cinematic Sequence
            setTimeout(() => {
                setShowIntro(false);
                setShowWelcome(true);
                setTimeout(() => {
                    setShowWelcome(false);
                    setAnimationComplete(true);
                }, 3000);
            }, 3000);
        };


        init();

        // Real-time subscriptions
        const orderChannel = supabase
            .channel("captain-orders")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => fetchOrders()
            )
            .subscribe();

        const tableChannel = supabase
            .channel("captain-tables")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "res_tables" },
                () => fetchTables()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(orderChannel);
            supabase.removeChannel(tableChannel);
        };
    }, [router]);

    const fetchMenu = async () => {
        const { data: items } = await supabase.from("menu_items").select("*").order("name");
        const { data: cats } = await supabase.from("menu_categories").select("*").order("name");
        setMenuItems(items || []);
        setCategories(cats || []);
    };

    const fetchTables = async () => {
        const { data } = await supabase.from("res_tables").select("*").order("table_number");
        setTables(data || []);
    };

    const fetchOrders = async (staffOverride?: any) => {
        const activeStaff = staffOverride || staff;
        if (!activeStaff) {
            setLoading(false);
            return;
        }

        let query = supabase
            .from("orders")
            .select("*")
            .in("status", ["Pending", "Preparing", "Out for Delivery", "Served"])
            .order("created_at", { ascending: false });

        // Role-based filtering
        if (activeStaff.role === 'delivery') {
            // Delivery boy only sees Online and Delivery orders
            query = query.neq("order_type", "Dine-in").neq("order_type", "Counter");
        } else {
            // Captain only sees Dine-in and Counter orders
            query = query.in("order_type", ["Dine-in", "Counter"]);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching orders:", error);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

    const parsePrice = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const clean = String(val).replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, price: parsePrice(item.price), quantity: 1, notes: "" }];
        });
    };

    const updateCartQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === itemId) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const handleSendToKDS = async () => {
        if (!selectedTable || cart.length === 0) return;
        setUpdating("sending-kds");

        const total = cart.reduce((sum, item) => sum + (parsePrice(item.price) * Number(item.quantity || 0)), 0);

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_name: `Table ${selectedTable.table_number}`,
                customer_phone: "Dine-in",
                address: `Table ${selectedTable.table_number}`,
                total_amount: isNaN(total) ? 0 : total,
                status: "Pending",
                order_type: "Dine-in",
                table_id: selectedTable.id,
                received_by_staff_id: staff.id
            })
            .select()
            .single();

        if (orderError) {
            alert("Error creating order: " + orderError.message);
            setUpdating(null);
            return;
        }

        // 2. Insert Order Items
        const orderItems = cart.map(item => ({
            order_id: order.id,
            menu_item_name: item.name,
            quantity: Number(item.quantity || 0),
            price: parsePrice(item.price),
            subtotal: parsePrice(item.price) * Number(item.quantity || 0),
            item_notes: item.notes
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

        if (itemsError) {
            alert("Error adding items: " + itemsError.message);
        } else {
            // 3. Update Table Status
            await supabase.from("res_tables").update({ status: "Occupied" }).eq("id", selectedTable.id);
            await logStaffActivity(staff.id, `Placed order for Table ${selectedTable.table_number}`, order.id);
            setSelectedTable(null);
            setCart([]);
            setActiveTab("missions");
        }

        setUpdating(null);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);

        const { error } = await supabase
            .from("orders")
            .update({
                status: newStatus,
                assigned_staff_id: staff.id,
                ...(newStatus === "Delivered" || newStatus === "Payment Completed" || newStatus === "Served" ? { completed_at: new Date().toISOString() } : {})
            })
            .eq("id", orderId);

        if (!error) {
            await logStaffActivity(staff.id, `Updated Order #${orderId.slice(0, 8)} to ${newStatus}`, orderId);
        } else {
            alert("Error updating order: " + error.message);
        }

        setUpdating(null);
        fetchOrders();
    };

    const handleLogout = async () => {
        await logoutStaff();
        router.replace("/captain/login");
    };

    if (loading || !staff) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--color-pizza-red)]" />
            </div>
        );
    }

    if (!animationComplete) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {showIntro && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className="flex flex-col items-center justify-center absolute inset-0 z-10"
                        >
                            <motion.h1
                                initial={{ letterSpacing: "1em", opacity: 0 }}
                                animate={{ letterSpacing: "0.4em", opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="text-4xl md:text-6xl font-black text-white text-center tracking-[0.4em] uppercase"
                            >
                                MEDIA<span className="text-[var(--color-pizza-red)]">GENY</span>
                            </motion.h1>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.8, duration: 1 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-[var(--color-pizza-red)] to-transparent mt-4 w-64"
                            />
                        </motion.div>
                    )}

                    {showWelcome && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.8, ease: "backOut" }}
                            className="flex flex-col items-center justify-center text-center p-8 absolute inset-0 z-20"
                        >
                            <div className="inline-flex items-center justify-center p-6 bg-[var(--color-pizza-red)] rounded-[2.5rem] mb-8 shadow-2xl shadow-red-900/40 border border-white/20">
                                <Sparkles className="text-white w-12 h-12" />
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Authorization Confirmed</p>
                                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 font-display italic tracking-tighter">
                                    WELCOME <span className="text-[var(--color-pizza-red)] uppercase">CAPTAIN-{staff.name}</span>
                                </h1>
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs opacity-60">Initializing Command Hub...</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 pb-24 safe-area-bottom">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 pt-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-[var(--color-pizza-red)] rounded-lg flex items-center justify-center">
                            <ChefHat size={16} className="text-white" />
                        </div>
                        <h1 className="text-xl font-display font-black tracking-tighter uppercase italic">
                            CAPTAIN <span className="text-[var(--color-pizza-red)]">HUB</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span className="flex items-center gap-1"><User size={10} /> {staff.name}</span>
                        <span className="opacity-20">|</span>
                        <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[8px] h-4 py-0 uppercase">
                            {staff.role}
                        </Badge>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-zinc-500 hover:text-red-500 transition-colors"
                >
                    <LogOut size={20} />
                </Button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Active</p>
                    <p className="text-2xl font-black font-display tracking-tight">{orders.length}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Queue</p>
                    <p className="text-2xl font-black font-display tracking-tight text-[var(--color-pizza-red)]">
                        {orders.filter(o => o.status === 'Pending').length}
                    </p>
                </div>
            </div>

            {/* Active Content Selection */}
            <div className="space-y-4">
                {activeTab === "missions" && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Live Mission Logs</h2>
                            <Button variant="ghost" size="sm" onClick={fetchOrders} className="text-zinc-500 h-6 text-[8px] uppercase tracking-widest gap-1">
                                <RefreshCw size={10} /> Sync
                            </Button>
                        </div>

                        {orders.length === 0 ? (
                            <div className="py-20 text-center">
                                <Package size={40} className="mx-auto text-zinc-800 mb-4 opacity-20" />
                                <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest">No active missions</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {orders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden shadow-xl active:scale-[0.98] transition-transform">
                                            <div className="p-4 bg-white/5 flex items-center justify-between border-b border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                                        order.order_type === 'Delivery' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                                    )}>
                                                        {order.order_type === 'Delivery' ? <Truck size={18} /> : <Utensils size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{order.customer_name}</p>
                                                        <p className="text-[9px] font-mono text-zinc-500">#{order.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-black text-white">₹{order.total_amount}</p>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] h-4 py-0 font-black border-none uppercase",
                                                        order.status === 'Pending' ? 'text-yellow-500' :
                                                            order.status === 'Preparing' ? 'text-blue-500' :
                                                                order.status === 'Out for Delivery' ? 'text-purple-500' :
                                                                    'text-green-500'
                                                    )}>
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-4 space-y-4">
                                                <div className="flex items-center gap-4 text-xs">
                                                    <div className="flex items-center gap-1 text-zinc-500">
                                                        <Clock size={12} />
                                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-zinc-500 truncate">
                                                        <MapPin size={12} />
                                                        <span className="truncate max-w-[150px]">{order.address || (order.table_id ? `Table ${order.table_id}` : "Counter")}</span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons - Simplified for Mission Logs */}
                                                <div className="grid grid-cols-1 gap-3 pt-2">
                                                    {['Served', 'Delivered'].includes(order.status) && (
                                                        <Button
                                                            onClick={() => handleUpdateStatus(order.id, 'Payment Completed')}
                                                            disabled={!!updating}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl text-xs uppercase tracking-widest gap-2"
                                                        >
                                                            {updating === order.id ? <Loader2 className="animate-spin" size={16} /> : (
                                                                <>
                                                                    <Banknote size={16} />
                                                                    Mark as Paid
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </>
                )}

                {activeTab === "tables" && (
                    <div className="space-y-6">
                        {!selectedTable ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Live Table Matrix</h2>
                                    <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[8px] uppercase">{tables.length} Total</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {tables.map((table) => (
                                        <Card
                                            key={table.id}
                                            onClick={() => setSelectedTable(table)}
                                            className="bg-white/5 border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <div className={cn(
                                                "h-1.5 w-full",
                                                table.status === 'Occupied' ? 'bg-red-500' : table.status === 'Reserved' ? 'bg-yellow-500' : 'bg-green-500'
                                            )} />
                                            <CardContent className="p-4 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Table</p>
                                                <p className="text-3xl font-black font-display tracking-tighter mb-2">{table.table_number}</p>
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0 h-4 border-none",
                                                    table.status === 'Occupied' ? 'bg-red-500/20 text-red-500' :
                                                        table.status === 'Reserved' ? 'bg-yellow-500/20 text-yellow-500' :
                                                            'bg-green-500/20 text-green-500'
                                                )}>
                                                    {table.status}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="fixed inset-0 z-[60] bg-black flex flex-col pt-safe overflow-hidden">
                                {/* Menu Header */}
                                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)} className="rounded-full">
                                            <ArrowLeft size={20} />
                                        </Button>
                                        <div>
                                            <h2 className="text-lg font-black font-display tracking-tight uppercase italic text-white">
                                                Table <span className="text-[var(--color-pizza-red)]">{selectedTable.table_number}</span>
                                            </h2>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Digital Menu System</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-full flex items-center justify-center">
                                            <ShoppingCart size={18} className="text-zinc-400" />
                                            {cart.length > 0 && (
                                                <Badge className="absolute -top-1 -right-1 bg-[var(--color-pizza-red)] text-white text-[8px] h-4 w-4 flex items-center justify-center p-0 rounded-full border-2 border-black">
                                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Search & Category Scroll */}
                                <div className="p-4 bg-zinc-900/30 space-y-4 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search items..."
                                            className="pl-10 h-11 bg-black/50 border-white/5 rounded-xl text-xs text-white"
                                        />
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        <Button
                                            size="sm"
                                            onClick={() => setSelectedCategory("all")}
                                            className={cn(
                                                "rounded-full text-[9px] uppercase font-black tracking-widest px-4 h-7 shrink-0",
                                                selectedCategory === "all" ? "bg-white text-black" : "bg-white/5 text-zinc-400 border border-white/5"
                                            )}
                                        >
                                            All Units
                                        </Button>
                                        {categories.map(cat => (
                                            <Button
                                                key={cat.id}
                                                size="sm"
                                                onClick={() => setSelectedCategory(cat.name)}
                                                className={cn(
                                                    "rounded-full text-[9px] uppercase font-black tracking-widest px-4 h-7 shrink-0",
                                                    selectedCategory === cat.name ? "bg-white text-black" : "bg-white/5 text-zinc-400 border border-white/5"
                                                )}
                                            >
                                                {cat.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Menu Grid */}
                                <div className="flex-1 overflow-y-auto p-4 content-pb-cart custom-scrollbar">
                                    <div className="grid gap-3 pb-8">
                                        {menuItems
                                            .filter(item => (selectedCategory === "all" || item.category === selectedCategory) &&
                                                item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => addToCart(item)}
                                                    className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-black/40 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                                            {item.image_url ? (
                                                                <img src={item.image_url} alt="" className="w-full h-full object-cover opacity-80" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                                                    <Package size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-white">{item.name}</p>
                                                            <p className="text-[10px] font-bold text-[var(--color-pizza-red)]">₹{item.price}</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <Plus size={14} className="text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Cart Slide/Overlay */}
                                {cart.length > 0 && (
                                    <motion.div
                                        initial={{ y: 200 }}
                                        animate={{ y: 0 }}
                                        className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 p-6 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] z-[70] max-h-[75vh] flex flex-col"
                                    >
                                        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 shrink-0" />

                                        <div className="flex items-center justify-between mb-6 shrink-0">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Order Manifest</h3>
                                            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-[10px] text-zinc-600 uppercase font-black">Clear</Button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-6 mb-6 custom-scrollbar pr-2">
                                            {cart.map(item => (
                                                <div key={item.id} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 mr-4">
                                                            <p className="text-[11px] font-black text-white uppercase tracking-tight">{item.name}</p>
                                                            <p className="text-[10px] text-zinc-500 font-mono">₹{item.price} × {item.quantity} = ₹{parsePrice(item.price) * Number(item.quantity || 0)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                                                            <button onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, -1); }} className="text-zinc-600 hover:text-red-500 p-1">
                                                                <Minus size={12} />
                                                            </button>
                                                            <span className="text-[11px] font-black text-white w-4 text-center">{item.quantity}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, 1); }} className="text-[var(--color-pizza-red)] p-1">
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <Input
                                                        placeholder="Add instructions (modifiers)..."
                                                        value={item.notes}
                                                        onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? { ...i, notes: e.target.value } : i))}
                                                        className="h-8 text-[10px] bg-black/40 border-white/5 rounded-xl text-zinc-400 placeholder:text-zinc-700"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-6 border-t border-white/5 space-y-4 shrink-0">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Bill</p>
                                                    <p className="text-3xl font-black font-display tracking-tighter text-white italic">₹{cart.reduce((a, b) => a + (parsePrice(b.price) * Number(b.quantity || 0)), 0)}</p>
                                                </div>
                                                <Button
                                                    onClick={handleSendToKDS}
                                                    disabled={updating === "sending-kds"}
                                                    className="bg-[var(--color-pizza-red)] hover:bg-red-600 text-white font-black h-16 px-10 rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-red-900/40 gap-3"
                                                >
                                                    {updating === "sending-kds" ? <Loader2 className="animate-spin text-white" size={20} /> : (
                                                        <>
                                                            <ChefHat size={18} /> Send to KDS
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "profile" && (staff && (
                    <div className="space-y-6">
                        <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
                            <CardContent className="p-8 text-center">
                                <div className="w-20 h-20 bg-[var(--color-pizza-red)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-900/30">
                                    <User size={40} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">{staff.name}</h2>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">@{staff.username} • {staff.role}</p>

                                <div className="space-y-3">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center text-left">
                                        <div>
                                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Mobile Contact</p>
                                            <p className="text-sm font-bold text-white">{staff.phone || "Not Registered"}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleLogout}
                                        className="w-full bg-zinc-800 hover:bg-red-600 text-white font-black h-12 rounded-2xl text-xs uppercase tracking-widest transition-colors mt-8"
                                    >
                                        End Mission Session
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Bottom Navigation (Fixed) */}
            <div className="fixed bottom-6 left-4 right-4 h-16 bg-zinc-900/80 backdrop-blur-3xl border border-white/5 rounded-3xl z-50 flex items-center justify-around px-8 shadow-2xl">
                <button
                    onClick={() => setActiveTab("tables")}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        activeTab === "tables" ? "text-[var(--color-pizza-red)] scale-110" : "text-zinc-600"
                    )}
                >
                    <Utensils size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Tables</span>
                </button>
                <button
                    onClick={() => setActiveTab("missions")}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        activeTab === "missions" ? "text-[var(--color-pizza-red)] scale-110" : "text-zinc-600"
                    )}
                >
                    <Package size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Missions</span>
                </button>
                <button
                    onClick={() => setActiveTab("profile")}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        activeTab === "profile" ? "text-[var(--color-pizza-red)] scale-110" : "text-zinc-600"
                    )}
                >
                    <User size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </div>
        </div>
    );
}

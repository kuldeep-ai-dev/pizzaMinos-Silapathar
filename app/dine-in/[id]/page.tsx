"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ShoppingBag, ArrowRight, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Menu from "@/components/sections/Menu";
import { useCart } from "@/context/CartContext";

export default function DineInPage() {
    const { id } = useParams();
    const [error, setError] = useState<string | null>(null);
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    const params = useParams();
    const [table, setTable] = useState<any>(null);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const { items, cartTotal, clearCart } = useCart();
    const supabase = createClient();

    const fetchTableAndOrder = async () => {
        if (!id) return;

        // Fetch Table
        const { data: tableData } = await supabase
            .from("res_tables")
            .select("*")
            .eq("id", id)
            .single();

        setTable(tableData);

        // Fetch ACTIVE Order (Not Payment Completed)
        const { data: orderData } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("table_id", id)
            .neq("status", "Payment Completed")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        setActiveOrder(orderData);
        setLoading(false);
    };

    useEffect(() => {
        fetchTableAndOrder();

        // Subscribe to order changes (status, etc.)
        const orderSubscription = supabase
            .channel(`dine-in-order-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `table_id=eq.${id}`
            }, (payload) => {
                console.log("Dine-in Order Update:", payload);
                const updatedOrder = payload.new as any;
                if (updatedOrder && updatedOrder.status === 'Payment Completed') {
                    setActiveOrder(null);
                } else {
                    fetchTableAndOrder();
                }
            })
            .subscribe((status) => {
                setRealtimeConnected(status === 'SUBSCRIBED');
            });

        // Subscribe to item changes (if chef adds items or updates them)
        const itemsSubscription = supabase
            .channel(`dine-in-items-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items'
            }, () => {
                fetchTableAndOrder();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(orderSubscription);
            supabase.removeChannel(itemsSubscription);
        };
    }, [id]);

    const handlePlaceDineInOrder = async () => {
        if (items.length === 0) return;
        if (!customerInfo.name || !customerInfo.phone) {
            setShowInfoDialog(true);
            return;
        }

        setLoading(true);

        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert([{
                customer_name: customerInfo.name,
                customer_phone: customerInfo.phone,
                address: `Dine-in: Table ${table?.table_number || 'Unknown'}`,
                total_amount: cartTotal,
                status: "Pending",
                order_type: "Dine-in",
                table_id: id
            }])
            .select()
            .single();

        if (orderError) {
            alert("Error placing order: " + orderError.message);
            setLoading(false);
            return;
        }

        // 2. Create Order Items
        const orderItems = items.map(item => ({
            order_id: orderData.id,
            menu_item_name: item.name,
            variant_name: item.variant,
            price: parseInt(item.price.replace(/[^0-9]/g, "")),
            quantity: item.quantity,
            subtotal: parseInt(item.price.replace(/[^0-9]/g, "")) * item.quantity
        }));

        await supabase.from("order_items").insert(orderItems);

        // Refresh to show status view
        fetchTableAndOrder();
        clearCart();
        setShowInfoDialog(false);
        setLoading(false);
    };

    if (loading && !table) {
        return (
            <div className="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--color-pizza-red)] w-12 h-12" />
            </div>
        );
    }

    if (!table) {
        return (
            <div className="min-h-screen bg-[var(--color-dark-bg)] flex flex-col items-center justify-center p-8 text-center">
                <TableIcon size={64} className="text-gray-600 mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Invalid Table QR</h1>
                <p className="text-gray-400">This QR code doesn't seem to belong to any table at PizzaMinos.</p>
                <Button onClick={() => window.location.href = '/'} className="mt-8 bg-[var(--color-pizza-red)]">
                    Take me Home
                </Button>
            </div>
        );
    }

    // Status View for Active Orders
    if (activeOrder) {
        return (
            <div className="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center max-w-md w-full shadow-2xl"
                >
                    <div className="w-20 h-20 bg-[var(--color-pizza-red)]/20 text-[var(--color-pizza-red)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--color-pizza-red)]/30 shadow-[0_0_30px_rgba(235,0,0,0.2)] relative">
                        <Loader2 size={40} className="animate-spin" />
                        <div className={`absolute -right-1 -top-1 w-4 h-4 rounded-full border-4 border-[var(--color-dark-bg)] shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-colors duration-500 ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={realtimeConnected ? "Real-time Connection Active" : "Connection Lost"} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-tight uppercase">Live Order Track</h2>
                    <p className="text-gray-400 mb-6 italic text-xs tracking-widest uppercase opacity-60">
                        {realtimeConnected ? "Connected to Kitchen" : "Syncing with Kitchen..."} • Table {table.table_number}
                    </p>

                    <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5 text-left">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                            <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Kitchen Track</span>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeOrder.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                activeOrder.status === 'Preparing' ? 'bg-blue-500/20 text-blue-500' :
                                    'bg-[var(--color-pizza-red)]/20 text-[var(--color-pizza-red)]'
                                }`}>
                                {activeOrder.status}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {activeOrder.order_items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 leading-tight">
                                        <span className="text-white font-bold">{item.quantity}x</span> {item.menu_item_name}
                                    </span>
                                    <span className="text-white font-mono font-bold">₹{item.subtotal}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Grand Total</span>
                            <span className="text-2xl font-bold text-white tracking-tighter font-display">₹{activeOrder.total_amount}</span>
                        </div>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                        <p>Enjoy your meal at Silapather!</p>
                        <p className="mt-2 text-[var(--color-pizza-red)] font-black">QR Menu resets after payment.</p>
                        <a
                            href="https://www.mediageny.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 block text-[9px] text-white/40 hover:text-[var(--color-pizza-red)] font-bold transition-colors"
                        >
                            Powered by MediaGeny
                        </a>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--color-dark-bg)]/80 backdrop-blur-xl border-b border-white/10 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-pizza-red)] rounded-lg text-white shadow-[0_0_15px_rgba(235,0,0,0.3)]">
                            <TableIcon size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-lg tracking-tight">Table {table.table_number}</h1>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Dine-in Menu</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <ShoppingBag className="text-white group-hover:scale-110 transition-transform" />
                        {items.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[var(--color-pizza-red)] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-dark-bg)] shadow-lg animate-pulse">
                                {items.length}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Menu Section */}
            <div className="container mx-auto pt-6 px-4">
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-1 px-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--color-pizza-red)] mb-4"
                    >
                        Premium Dine-in Experience
                    </motion.div>
                    <h2 className="text-4xl font-display font-bold text-white tracking-tighter">PizzaMinos <span className="text-[var(--color-pizza-red)]">Hub</span></h2>
                    <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto italic">Pick your favorites from our premium selection downstairs.</p>
                </div>

                <Menu />
            </div>

            {/* Guest Details Modal */}
            <AnimatePresence>
                {showInfoDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInfoDialog(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#1A1A1A] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full relative z-10 shadow-2xl"
                        >
                            <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">Guest Info</h3>
                            <p className="text-gray-400 text-xs mb-6 uppercase tracking-widest font-bold opacity-60">Before we send it to kitchen</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Kuldeep..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-pizza-red)] transition-colors"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-2">Mobile Number</label>
                                    <input
                                        type="tel"
                                        placeholder="10-digit number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-pizza-red)] transition-colors"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    />
                                </div>
                                <Button
                                    disabled={loading || !customerInfo.name || customerInfo.phone.length < 10}
                                    onClick={handlePlaceDineInOrder}
                                    className="w-full h-16 bg-[var(--color-pizza-red)] text-white font-black text-lg rounded-2xl mt-4 shadow-[0_10px_30px_rgba(235,0,0,0.3)]"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "CONFIRM ORDER"}
                                </Button>
                                <button
                                    onClick={() => setShowInfoDialog(false)}
                                    className="w-full text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-2 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Action Button for Checkout */}
            <AnimatePresence>
                {items.length > 0 && !showInfoDialog && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50"
                    >
                        <Button
                            onClick={() => setShowInfoDialog(true)}
                            className="w-full h-18 py-8 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-bold rounded-[1.5rem] shadow-2xl shadow-[var(--color-pizza-red)]/40 flex items-center justify-between px-6 border-b-4 border-black/20 transform active:scale-95 transition-all"
                        >
                            <div className="text-left">
                                <span className="block text-[10px] uppercase font-black opacity-70 tracking-widest mb-1">Items in Cart</span>
                                <span className="text-2xl font-display font-bold">₹{cartTotal}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/20 py-3 px-5 rounded-2xl border border-white/10">
                                <span className="font-black uppercase text-[12px] tracking-widest">Review</span>
                                <ArrowRight size={20} />
                            </div>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Branding */}
            <div className="text-center pb-8">
                <a
                    href="https://www.mediageny.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-white/30 hover:text-[var(--color-pizza-red)] font-bold uppercase tracking-[0.2em] transition-colors"
                >
                    Powered by MediaGeny
                </a>
            </div>
        </div>
    );
}

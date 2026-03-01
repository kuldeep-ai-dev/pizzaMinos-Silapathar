"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    ChefHat,
    AlertCircle,
    Timer,
    ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderItem {
    id: string;
    menu_item_name: string;
    variant_name: string;
    quantity: number;
    preparation_status: string;
}

interface Order {
    id: string;
    customer_name: string;
    order_type: string;
    status: string;
    notes: string;
    priority: string;
    table_id: string;
    created_at: string;
    items?: OrderItem[];
    table_number?: string;
}

export default function KDSView() {
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const prevOrderIds = useRef<string>("");

    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playBeep = (freq: number, start: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + 0.2);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + 0.2);
            };
            playBeep(880, 0);       // High beep
            playBeep(1108.73, 0.15); // Higher beep (C#6)
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    const fetchKDSOrders = async () => {
        const { data: ordersData, error } = await supabase
            .from("orders")
            .select("*, order_items(*), res_tables(table_number)")
            .in("status", ["Pending", "Preparing"])
            .order("created_at", { ascending: true });

        if (error) {
            console.error("KDS Fetch Error:", error);
            return;
        }

        const formattedOrders = (ordersData || []).map(order => ({
            ...order,
            items: order.order_items || [],
            table_number: order.res_tables?.table_number
        }));

        // Check for new orders to play sound
        const currentIds = formattedOrders.map(o => o.id).join(',');
        if (prevOrderIds.current && prevOrderIds.current !== currentIds) {
            const oldIds = prevOrderIds.current.split(',');
            const newOrdersAdded = formattedOrders.some(o => !oldIds.includes(o.id));
            if (newOrdersAdded) {
                playNotificationSound();
            }
        }
        prevOrderIds.current = currentIds;

        setOrders(formattedOrders);
        setLoading(false);
    };

    useEffect(() => {
        fetchKDSOrders();

        // Polling fallback since Vercel API Proxy does not support streaming WebSockets
        const intervalId = setInterval(() => {
            fetchKDSOrders();
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const toggleItemStatus = async (orderId: string, itemId: string, currentStatus: string) => {
        const nextStatus = currentStatus === "Prepared" ? "Pending" : "Prepared";

        // If starting the first item, mark order as "Preparing" and set preparing_at
        const order = orders.find(o => o.id === orderId);
        if (nextStatus === "Prepared" && order?.status === "Pending") {
            await supabase
                .from("orders")
                .update({
                    status: "Preparing",
                    preparing_at: new Date().toISOString()
                })
                .eq("id", orderId);
        }

        await supabase
            .from("order_items")
            .update({ preparation_status: nextStatus })
            .eq("id", itemId);

        // Check if ALL items are now prepared to set ready_at
        const updatedItems = order?.items?.map(i => i.id === itemId ? { ...i, preparation_status: nextStatus } : i);
        if (updatedItems?.every(i => i.preparation_status === "Prepared")) {
            await supabase
                .from("orders")
                .update({ ready_at: new Date().toISOString() })
                .eq("id", orderId);
        }

        fetchKDSOrders();
    };

    const markOrderReady = async (orderId: string, type: string) => {
        const isDineIn = type === "Dine-in" || type === "Counter";
        const finalStatus = isDineIn ? "Served" : "Out for Delivery";

        const updateData: any = {
            status: finalStatus,
            ready_at: new Date().toISOString() // Ensure ready_at is set if not already
        };

        if (finalStatus === "Served") {
            updateData.completed_at = new Date().toISOString();
        }

        await supabase
            .from("orders")
            .update(updateData)
            .eq("id", orderId);

        fetchKDSOrders();
    };

    const getElapsedTime = (createdAt: string) => {
        const start = new Date(createdAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 60000);
        return diff;
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <ChefHat className="w-12 h-12 text-[var(--color-pizza-red)] animate-bounce" />
                    <p className="text-white font-bold uppercase tracking-widest animate-pulse">Syncing Kitchen Station...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-6">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--color-pizza-red)] rounded-2xl shadow-[0_0_20px_rgba(255,0,0,0.3)]">
                        <ChefHat className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Kitchen Display</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em]">Live Order Monitoring Matrix</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">{orders.length}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Tickets</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-green-500 uppercase">Live Connection</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {orders.map((order) => {
                        const elapsed = getElapsedTime(order.created_at);
                        const isLate = elapsed > 15;
                        const isRush = order.priority === "Rush";
                        const allPrepared = order.items?.every(i => i.preparation_status === "Prepared");

                        return (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative"
                            >
                                <Card className={cn(
                                    "bg-[#111] border-2 transition-all duration-500 overflow-hidden h-full flex flex-col",
                                    isRush ? "border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]" : "border-white/5",
                                    allPrepared ? "border-green-600" : ""
                                )}>
                                    <div className={cn(
                                        "p-4 border-b flex justify-between items-start",
                                        isRush ? "bg-red-600/10 border-red-600/20" : "bg-white/5 border-white/5"
                                    )}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    order.order_type === "Dine-in" ? "bg-blue-600" : "bg-emerald-600"
                                                )}>
                                                    {order.order_type}
                                                </Badge>
                                                {isRush && (
                                                    <Badge className="bg-red-600 animate-pulse">RUSH</Badge>
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-black text-white tracking-widest leading-none">
                                                {order.order_type === "Dine-in" ? `TABLE ${order.table_number || '?'}` : `ORD #${order.id.slice(0, 4)}`}
                                            </h3>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold",
                                            isLate ? "bg-red-600/20 border-red-600/40 text-red-500 animate-pulse" : "bg-black border-white/10 text-gray-400"
                                        )}>
                                            <Timer size={14} />
                                            {elapsed}m
                                        </div>
                                    </div>

                                    <CardContent className="p-4 flex-1">
                                        {order.notes && (
                                            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                                <p className="text-[10px] text-yellow-500 font-black uppercase mb-1 flex items-center gap-1">
                                                    <AlertCircle size={10} /> Chef Notes
                                                </p>
                                                <p className="text-xs text-yellow-200/80 italic font-medium">"{order.notes}"</p>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {order.items?.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleItemStatus(order.id, item.id, item.preparation_status)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98]",
                                                        item.preparation_status === "Prepared"
                                                            ? "bg-green-600/20 border-green-600/40 opacity-50"
                                                            : "bg-white/5 border-white/5 hover:border-white/20"
                                                    )}
                                                >
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded bg-white/10 text-white font-black text-xs">
                                                                {item.quantity}
                                                            </div>
                                                            <span className={cn(
                                                                "font-bold text-sm tracking-tight",
                                                                item.preparation_status === "Prepared" ? "text-gray-500 line-through" : "text-white"
                                                            )}>
                                                                {item.menu_item_name}
                                                            </span>
                                                        </div>
                                                        {item.variant_name && (
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase ml-8 tracking-widest">
                                                                {item.variant_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                                                        item.preparation_status === "Prepared"
                                                            ? "bg-green-600 border-green-600 text-white"
                                                            : "border-white/10 text-transparent"
                                                    )}>
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>

                                    <div className="p-4 bg-white/5 mt-auto border-t border-white/5">
                                        <button
                                            onClick={() => markOrderReady(order.id, order.order_type)}
                                            className={cn(
                                                "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all text-sm",
                                                allPrepared
                                                    ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_4px_20px_rgba(22,163,74,0.3)] scale-[1.02]"
                                                    : "bg-white/10 hover:bg-white/20 text-gray-400"
                                            )}
                                        >
                                            {allPrepared ? (
                                                <>MARK COMPLETED <ArrowRight size={18} /></>
                                            ) : (
                                                <>WAITING ON ITEMS...</>
                                            )}
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-40 opacity-20">
                        <CheckCircle2 size={80} className="text-gray-500 mb-4" />
                        <h2 className="text-4xl font-black text-white uppercase tracking-widest italic">All Clear, Chef!</h2>
                    </div>
                )}
            </div>
        </div>
    );
}

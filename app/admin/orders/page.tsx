"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Printer, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import CopyButton from "@/components/admin/CopyButton";
import { cn } from "@/lib/utils";

interface OrderItem {
    id: string;
    menu_item_name: string;
    variant_name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    gps_location: string;
    total_amount: number;
    status: string;
    order_type: string;
    table_id: string | null;
    notes?: string;
    priority?: string;
    created_at: string;
    items?: OrderItem[];
    assigned_staff_id?: string;
    received_by_staff_id?: string;
    assigned_staff?: { name: string };
    received_by_staff?: { name: string };
    staff?: { name: string };
}

export default function OrdersPage() {
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"Delivery" | "Dine-in">("Delivery");

    const fetchStaff = async () => {
        const { data } = await supabase.from("staff").select("id, name, role");
        setStaffList(data || []);
    };

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true);

        const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select(`
                *,
                assigned_staff:assigned_staff_id(name),
                received_by_staff:received_by_staff_id(name)
            `)
            .order("created_at", { ascending: false });

        if (ordersError) {
            console.error("Error fetching orders:", ordersError);
            if (!silent) setLoading(false);
            return;
        }

        const ordersWithItems = await Promise.all(
            (ordersData || []).map(async (order) => {
                const { data: items } = await supabase
                    .from("order_items")
                    .select("*")
                    .eq("order_id", order.id);

                return { ...order, items: items || [] };
            })
        );

        setOrders(ordersWithItems);
        if (!silent) setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
        fetchStaff();

        // Polling fallback since Vercel API Proxy does not support streaming WebSockets
        const intervalId = setInterval(() => {
            fetchOrders(true);
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const handleAssignStaff = async (orderId: string, staffId: string) => {
        const { error } = await supabase
            .from("orders")
            .update({ assigned_staff_id: staffId })
            .eq("id", orderId);

        if (error) {
            alert("Error assigning staff: " + error.message);
        } else {
            fetchOrders(true);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        if (newStatus === "Cancelled") {
            if (!confirm("Are you sure you want to CANCEL and PERMANENTLY DELETE this order? This action cannot be undone.")) return;
            const { error } = await supabase.from("orders").delete().eq("id", id);
            if (error) {
                alert("Failed to delete order: " + error.message);
            }
        } else {
            const updateData: any = { status: newStatus };

            // Kitchen Performance Timestamps
            if (newStatus === "Preparing") {
                updateData.preparing_at = new Date().toISOString();
            } else if (["Served", "Delivered", "Payment Completed"].includes(newStatus)) {
                updateData.completed_at = new Date().toISOString();
            }

            await supabase.from("orders").update(updateData).eq("id", id);
        }
        fetchOrders(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
            case "Preparing": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
            case "Out for Delivery": return "bg-purple-500/20 text-purple-500 border-purple-500/50";
            case "Delivered": return "bg-green-500/20 text-green-500 border-green-500/50";
            case "Served": return "bg-orange-500/20 text-orange-500 border-orange-500/50";
            case "Payment Completed": return "bg-green-600 text-white border-green-500";
            case "Cancelled": return "bg-red-500/20 text-red-500 border-red-500/50";
            default: return "bg-gray-500/20 text-gray-500";
        }
    };

    const filteredOrders = orders.filter(order => {
        const isDineIn = order.order_type === 'Dine-in' || order.order_type === 'Counter';
        return activeTab === "Dine-in" ? isDineIn : !isDineIn;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Orders Control</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest opacity-60">Manage your active orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => fetchOrders()} variant="outline" className="border-white/20 text-white gap-2">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                    </Button>
                </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                <button
                    onClick={() => setActiveTab("Delivery")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "Delivery" ? "bg-[var(--color-pizza-red)] text-white shadow-lg" : "text-gray-500 hover:text-white"}`}
                >
                    Online/Delivery
                </button>
                <button
                    onClick={() => setActiveTab("Dine-in")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "Dine-in" ? "bg-[var(--color-pizza-red)] text-white shadow-lg" : "text-gray-500 hover:text-white"}`}
                >
                    Dine-in / POS
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin w-10 h-10 text-[var(--color-pizza-red)]" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="py-20 text-center">
                        <Package className="mx-auto w-12 h-12 text-gray-700 mb-4 opacity-20" />
                        <p className="text-gray-400">No {activeTab.toLowerCase()} orders at the moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                layout
                            >
                                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all overflow-hidden shadow-xl">
                                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 bg-white/5 border-b border-white/5 gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <CardTitle className="text-xl font-bold">{order.customer_name}</CardTitle>
                                                <Badge variant="outline" className={getStatusColor(order.status) + " text-[10px] font-bold"}>
                                                    {order.status}
                                                </Badge>
                                                {order.order_type === 'Dine-in' && (
                                                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-black">Table Session</Badge>
                                                )}
                                                {order.order_type === 'Counter' && (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-black">Counter POS</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 font-mono">
                                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 group/id">
                                                    <span className="text-[var(--color-pizza-red)] font-bold">#{order.id.slice(0, 8)}</span>
                                                    <CopyButton text={order.id.slice(0, 8)} className="h-4 w-4 p-0 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="opacity-50">{new Date(order.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-2xl font-bold font-display text-[var(--color-pizza-red)] tracking-tighter">₹{order.total_amount}</p>
                                            <p className="text-xs text-gray-400">{order.customer_phone}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                                                        <Package size={14} className="text-[var(--color-pizza-red)]" /> Order Items
                                                    </p>
                                                    <div className="space-y-2">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                <span className="text-gray-300">
                                                                    <span className="text-white font-bold">{item.quantity}x</span> {item.menu_item_name}
                                                                    {item.variant_name && <span className="text-[10px] text-gray-500 ml-1 italic">({item.variant_name})</span>}
                                                                </span>
                                                                <span className="text-gray-400">₹{item.price * item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {(order.notes || order.priority === "Rush") && (
                                                    <div className={cn(
                                                        "p-4 rounded-xl border",
                                                        order.priority === "Rush" ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/5 border-yellow-500/10"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Kitchen Notes</p>
                                                            {order.priority === "Rush" && (
                                                                <Badge className="bg-red-600 text-[8px] animate-pulse">RUSH ORDER</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-white italic">
                                                            {order.notes || "No special instructions"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 h-fit space-y-4">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Service info</p>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-white">
                                                            {order.order_type === 'Dine-in' ? "Restaurant Seat" : order.order_type === 'Counter' ? "Counter Sale" : "Home Delivery"}
                                                        </p>
                                                        <p className="text-xs text-gray-400 leading-relaxed">{order.address}</p>
                                                        {order.gps_location && order.order_type === 'Delivery' && (
                                                            <a
                                                                href={order.gps_location}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-[var(--color-pizza-red)] hover:underline mt-2 font-bold uppercase tracking-widest inline-flex items-center gap-1"
                                                            >
                                                                📍 Map Location
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-white/5">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Resource Allocation</p>
                                                    <div className="space-y-3">
                                                        {order.received_by_staff_id && (
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] uppercase tracking-widest px-2">Received By</Badge>
                                                                <span className="text-[10px] text-white font-bold">{order.received_by_staff?.name || 'Captain'}</span>
                                                            </div>
                                                        )}

                                                        {order.order_type === 'Delivery' && (
                                                            <div className="space-y-1.5">
                                                                <label className="text-[8px] text-zinc-500 uppercase font-black tracking-widest ml-1">Assign Agent</label>
                                                                <select
                                                                    value={order.assigned_staff_id || ""}
                                                                    onChange={(e) => handleAssignStaff(order.id, e.target.value)}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-lg text-[10px] h-8 px-2 text-white focus:outline-none focus:border-red-500 transition-all font-bold appearance-none"
                                                                >
                                                                    <option value="">Pending Assignment</option>
                                                                    {staffList.filter(s => s.role === 'delivery' || s.role === 'captain').map(s => (
                                                                        <option key={s.id} value={s.id} className="bg-zinc-900">{s.name} ({s.role})</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-white/5 pt-4">
                                            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                                {(activeTab === "Delivery"
                                                    ? ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
                                                    : ["Pending", "Preparing", "Served", "Payment Completed", "Cancelled"]
                                                ).map((status) => {
                                                    // Business Rule: Hide "Cancelled" once delivered or payment completed
                                                    const isFinalized = order.status === "Delivered" || order.status === "Payment Completed";
                                                    if (status === "Cancelled" && isFinalized) return null;

                                                    return (
                                                        <button
                                                            key={status}
                                                            onClick={() => updateStatus(order.id, status)}
                                                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${order.status === status ? getStatusColor(status) : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                                                        >
                                                            {status}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {(() => {
                                                // Business Rule: Print Bill accessible only when:
                                                // 1. Online: Out for Delivery or Delivered
                                                // 2. Dine-in/POS: Payment Completed
                                                const canPrint = activeTab === "Delivery"
                                                    ? (order.status === "Out for Delivery" || order.status === "Delivered")
                                                    : order.status === "Payment Completed";

                                                if (!canPrint) return null;

                                                return (
                                                    <Link href={`/admin/invoice/${order.id}`} target="_blank" className="w-full sm:w-auto">
                                                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-10 gap-2 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 group">
                                                            <Printer size={16} className="group-hover:scale-110 transition-transform" /> Print Bill
                                                        </Button>
                                                    </Link>
                                                );
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

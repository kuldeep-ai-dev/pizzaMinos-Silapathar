"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import StatsCard from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, DollarSign, Clock, TrendingUp, MapPin, Target, PieChart, Map as MapIcon, Calendar, Bell, Info } from "lucide-react";
import Link from "next/link";
import CopyButton from "@/components/admin/CopyButton";
import dynamic from "next/dynamic";

const OrderMap = dynamic(() => import("@/components/admin/OrderMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-black/20 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Initializing Map Matrix...</div>
});

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    todayOrders: number;
    totalReservations: number;
}

interface Order {
    id: string;
    customer_name: string;
    address: string;
    total_amount: number;
    status: string;
    created_at: string;
}

interface TopItem {
    name: string;
    count: number;
}

interface Location {
    name: string;
    count: number;
}

export default function AdminDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState<Stats>({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        todayOrders: 0,
        totalReservations: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [hotLocations, setHotLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrderToast, setNewOrderToast] = useState<Order | null>(null);

    useEffect(() => {
        fetchDashboardData();

        // The global listener in AdminSidebar handles notifications and refreshes.
        // We still subscribe here BUT ONLY to refresh the local stats, without sound/toasts
        // to avoid duplicating logic from the sidebar.
        // Actually, let's just keep it simple: fetch data once, and rely on the global 
        // listener to trigger a refresh if we had a global refresh event, 
        // but for now, we'll just keep a simple listener for stats only.

        const orderSubscription = supabase
            .channel('dashboard-stats-refresh')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
                fetchDashboardData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(orderSubscription);
        };
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);

        // Fetch orders with items for better analytics
        const { data: allOrders } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (*)
            `)
            .order("created_at", { ascending: false });

        if (allOrders) {
            // Basic Stats
            const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const pendingOrders = allOrders.filter(o => o.status === "Pending").length;
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = allOrders.filter(o => o.created_at.startsWith(today)).length;

            // Fetch reservations count
            const { count: resCount } = await supabase
                .from("reservations")
                .select("*", { count: 'exact', head: true });

            setStats({
                totalOrders: allOrders.length,
                totalRevenue,
                pendingOrders,
                todayOrders,
                totalReservations: resCount || 0,
            });

            // Aggregate Top Items
            const itemCounts: Record<string, number> = {};
            allOrders.forEach(order => {
                order.order_items?.forEach((item: any) => {
                    itemCounts[item.menu_item_name] = (itemCounts[item.menu_item_name] || 0) + item.quantity;
                });
            });
            const sortedItems = Object.entries(itemCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setTopItems(sortedItems);

            // Aggregate Hot Locations (Simple extraction from address)
            const locationCounts: Record<string, number> = {};
            allOrders.forEach(order => {
                // Try to get a broad area name (e.g., last part of address or before first comma)
                const parts = order.address.split(',');
                const area = parts.length > 1 ? parts[parts.length - 2].trim() : order.address.trim();
                locationCounts[area] = (locationCounts[area] || 0) + 1;
            });
            const sortedLocations = Object.entries(locationCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setHotLocations(sortedLocations);

            // Get recent 5 orders
            setRecentOrders(allOrders.slice(0, 5));
        }

        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
            case "Preparing": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
            case "Out for Delivery": return "bg-purple-500/20 text-purple-500 border-purple-500/50";
            case "Delivered": return "bg-green-500/20 text-green-500 border-green-500/50";
            default: return "bg-gray-500/20 text-gray-500";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-[var(--color-pizza-red)] animate-pulse font-bold">Loading Analytics...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            {/* Real-time Order Toast */}
            <AnimatePresence>
                {newOrderToast && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="fixed top-8 right-8 z-[100] w-80"
                    >
                        <Card className="bg-white border-2 border-[var(--color-pizza-red)] shadow-2xl overflow-hidden">
                            <div className="bg-[var(--color-pizza-red)] p-3 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <Bell size={18} className="animate-bounce" />
                                    <span className="font-bold text-sm tracking-widest uppercase">New Order!</span>
                                </div>
                                <button onClick={() => setNewOrderToast(null)} className="text-white/70 hover:text-white">
                                    <Clock size={16} />
                                </button>
                            </div>
                            <CardContent className="p-4 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-black text-lg">{newOrderToast.customer_name}</h4>
                                    <span className="text-[var(--color-pizza-red)] font-bold">₹{newOrderToast.total_amount}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                                    <MapPin size={12} className="text-gray-400" />
                                    <span className="truncate">{newOrderToast.address}</span>
                                </div>
                                <Link
                                    href={`/admin/invoice/${newOrderToast.id}`}
                                    onClick={() => setNewOrderToast(null)}
                                    className="block w-full text-center py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                                >
                                    View & Print Invoice
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                    Insights Dashboard
                </h1>
                <p className="text-gray-400">Deep-dive into your pizza business performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard title="Orders" value={stats.totalOrders} icon={ShoppingBag} />
                <StatsCard title="Revenue" value={`₹${stats.totalRevenue}`} icon={DollarSign} />
                <StatsCard title="Pending" value={stats.pendingOrders} icon={Clock} />
                <StatsCard title="Reservations" value={stats.totalReservations} icon={Calendar} />
                <StatsCard title="Today" value={stats.todayOrders} icon={TrendingUp} />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Ordered Items */}
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2">
                            <Target className="text-[var(--color-pizza-red)]" size={20} />
                            <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Most Ordered Items</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {topItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No sales data yet</p>
                        ) : (
                            <div className="space-y-6">
                                {topItems.map((item, idx) => {
                                    const maxCount = topItems[0].count;
                                    const percentage = (item.count / maxCount) * 100;
                                    return (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-200 font-medium">#{idx + 1} {item.name}</span>
                                                <span className="text-[var(--color-pizza-red)] font-bold">{item.count} sold</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[var(--color-pizza-red)]/50 to-[var(--color-pizza-red)] rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hot Locations */}
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2">
                            <PieChart className="text-purple-500" size={20} />
                            <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Hot Locations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {hotLocations.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No location data yet</p>
                        ) : (
                            <div className="space-y-4">
                                {hotLocations.map((loc, idx) => (
                                    <div key={loc.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-200">{loc.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{loc.count} orders</p>
                                        </div>
                                        <div className="text-purple-500">
                                            <MapPin size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Map View Integration */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapIcon className="text-blue-500" size={20} />
                        <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Order Distribution Map</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 h-[400px] relative">
                    <OrderMap orders={recentOrders} hotLocations={hotLocations} />
                </CardContent>
            </Card>

            {/* Recent Orders Table (Original) */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white uppercase tracking-widest text-sm font-bold opacity-70">Recent Transactions</CardTitle>
                    <Link
                        href="/admin/orders"
                        className="text-xs text-[var(--color-pizza-red)] hover:underline font-bold uppercase tracking-widest"
                    >
                        View All Activity →
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No orders yet</p>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-colors border border-white/5 group"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-200">{order.customer_name}</p>
                                            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 group/id">
                                                <span className="text-[10px] text-[var(--color-pizza-red)] font-bold font-mono">#{order.id.slice(0, 8)}</span>
                                                <CopyButton text={order.id.slice(0, 8)} className="h-4 w-4 p-0 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 opacity-50 truncate max-w-[150px]">
                                            Full ID: {order.id}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <Clock size={10} />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <MapPin size={10} />
                                                <span className="truncate max-w-[100px]">{order.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-bold text-white text-lg">
                                                ₹{order.total_amount}
                                            </p>
                                            <Badge variant="outline" className={getStatusColor(order.status) + " text-[8px] h-4 py-0"}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

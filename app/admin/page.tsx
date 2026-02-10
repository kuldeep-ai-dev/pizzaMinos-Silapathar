"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, DollarSign, Clock, TrendingUp, MapPin, Target, ChartPie, Map as MapIcon, Calendar, Bell, Info, Users, BarChart, Utensils, Timer, AlertCircle, CheckCircle2, ChefHat } from "lucide-react";
import Link from "next/link";
import CopyButton from "@/components/admin/CopyButton";
import dynamic from "next/dynamic";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';

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

interface OrderTypeStat {
    name: string;
    value: number;
}

interface HourlyRevenue {
    hour: string;
    amount: number;
}

interface TableSummary {
    available: number;
    occupied: number;
    reserved: number;
}

interface CustomerFreq {
    phone: string;
    name: string;
    count: number;
}

interface KitchenStats {
    avgPrepTime: number;
    avgCompletionTime: number;
    delayedOrders: number;
    peakLoadHour: string;
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
    const [orderTypes, setOrderTypes] = useState<OrderTypeStat[]>([]);
    const [hourlyRevenue, setHourlyRevenue] = useState<HourlyRevenue[]>([]);
    const [tableSummary, setTableSummary] = useState<TableSummary>({ available: 0, occupied: 0, reserved: 0 });
    const [customerFreqs, setCustomerFreqs] = useState<CustomerFreq[]>([]);
    const [aov, setAov] = useState(0);
    const [kitchenStats, setKitchenStats] = useState<KitchenStats>({
        avgPrepTime: 0,
        avgCompletionTime: 0,
        delayedOrders: 0,
        peakLoadHour: "00:00"
    });
    const [loading, setLoading] = useState(true);
    const [revenueFilter, setRevenueFilter] = useState<'today' | '1w' | '1m'>('today');
    const [topItemsFilter, setTopItemsFilter] = useState<'today' | '1w' | '1m'>('today');
    const [config, setConfig] = useState<Record<string, number>>({
        kitchen_prep_days: 7,
        kitchen_peak_days: 7,
        loyal_patrons_days: 30,
        hot_zones_days: 30
    });
    const [newOrderToast, setNewOrderToast] = useState<Order | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, [revenueFilter, topItemsFilter]);

    useEffect(() => {
        cleanupAndFetch();

        const orderSubscription = supabase
            .channel('dashboard-stats-refresh')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
                cleanupAndFetch();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(orderSubscription);
        };
    }, []);

    const cleanupAndFetch = async () => {
        setLoading(true);
        // REMOVED: Automatic 24-hour order deletion to allow weekly/monthly analytics
        await fetchDashboardData();
    };

    const fetchDashboardData = async () => {
        const istDateStr = new Date().toLocaleDateString("en-GB", {
            timeZone: "Asia/Kolkata",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').reverse().join('-');

        // Fetch Analytics Settings
        const { data: settings } = await supabase.from("app_settings").select("*");
        const newConfig = { ...config };
        if (settings) {
            settings.forEach(s => {
                if (s.key === 'analytics_kitchen_prep_days') newConfig.kitchen_prep_days = parseInt(s.value);
                if (s.key === 'analytics_kitchen_peak_days') newConfig.kitchen_peak_days = parseInt(s.value);
                if (s.key === 'analytics_loyal_patrons_days') newConfig.loyal_patrons_days = parseInt(s.value);
                if (s.key === 'analytics_hot_zones_days') newConfig.hot_zones_days = parseInt(s.value);
            });
            setConfig(newConfig);
        }

        // Fetch past 30 days of orders for analytics
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: allOrders } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (*)
            `)
            .gte("created_at", thirtyDaysAgo)
            .order("created_at", { ascending: false });

        const { data: tables } = await supabase
            .from("res_tables")
            .select("*");

        if (allOrders) {
            const filterByDays = (orders: any[], days: number) => {
                const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                return orders.filter(o => new Date(o.created_at) >= cutoff);
            };

            const getOrdersForFilter = (filter: string) => {
                if (filter === 'today') return allOrders.filter(o => {
                    const d = new Date(o.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
                    return d === istDateStr;
                });
                if (filter === '1w') return filterByDays(allOrders, 7);
                if (filter === '1m') return filterByDays(allOrders, 30);
                return allOrders;
            };

            const todayOrdersList = getOrdersForFilter('today');
            const revenueOrders = getOrdersForFilter(revenueFilter);
            const topItemOrders = getOrdersForFilter(topItemsFilter);

            // Stats (Always show Today for the top cards)
            const todayRevenue = todayOrdersList.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const todayOrdersCount = todayOrdersList.length;
            const avgOrderValue = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;
            setAov(avgOrderValue);

            setStats({
                totalOrders: todayOrdersCount,
                totalRevenue: todayRevenue,
                pendingOrders: todayOrdersList.filter(o => o.status === "Pending").length,
                todayOrders: todayOrdersCount,
                totalReservations: 0,
            });

            const { count: resCount } = await supabase
                .from("reservations")
                .select("*", { count: 'exact', head: true });
            if (resCount !== null) setStats(prev => ({ ...prev, totalReservations: resCount }));

            // Aggregate Top Items (Based on filter)
            const itemCounts: Record<string, number> = {};
            topItemOrders.forEach(order => {
                order.order_items?.forEach((item: any) => {
                    itemCounts[item.menu_item_name] = (itemCounts[item.menu_item_name] || 0) + item.quantity;
                });
            });
            setTopItems(Object.entries(itemCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5));

            // Aggregate Locations (1 Month data)
            const hotZoneOrders = filterByDays(allOrders, newConfig.hot_zones_days);
            const locationCounts: Record<string, number> = {};
            hotZoneOrders.forEach(order => {
                const parts = (order.address || "Counter").split(',');
                const area = parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
                locationCounts[area] = (locationCounts[area] || 0) + 1;
            });
            setHotLocations(Object.entries(locationCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5));

            // Aggregate Customer Frequency (1 Month data)
            const loyalOrders = filterByDays(allOrders, newConfig.loyal_patrons_days);
            const custCounts: Record<string, { name: string, count: number }> = {};
            loyalOrders.forEach(o => {
                const phone = o.customer_phone;
                if (!custCounts[phone]) custCounts[phone] = { name: o.customer_name, count: 0 };
                custCounts[phone].count++;
            });
            setCustomerFreqs(Object.entries(custCounts)
                .map(([phone, data]) => ({ phone, name: data.name, count: data.count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5));

            // Advanced Analytics: Order Types (Today)
            const typeCounts: Record<string, number> = { "Dine-in": 0, "Delivery": 0, "Counter": 0 };
            todayOrdersList.forEach(o => {
                const type = o.order_type || "Delivery";
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            setOrderTypes(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

            // Advanced Analytics: Hourly Revenue (Based on revenueFilter)
            const hours: Record<string, number> = {};
            if (revenueFilter === 'today') {
                for (let i = 0; i < 24; i++) {
                    const label = i.toString().padStart(2, '0') + ":00";
                    hours[label] = 0;
                }
                revenueOrders.forEach(o => {
                    const hour = new Date(o.created_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: '2-digit', hour12: false }) + ":00";
                    hours[hour] = (hours[hour] || 0) + Number(o.total_amount);
                });
            } else {
                // For 1w/1m, show daily revenue
                revenueOrders.forEach(o => {
                    const day = new Date(o.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: '2-digit', month: 'short' });
                    hours[day] = (hours[day] || 0) + Number(o.total_amount);
                });
            }
            setHourlyRevenue(Object.entries(hours).map(([hour, amount]) => ({ hour, amount })));

            // Kitchen Performance (Window based)
            const prepOrders = filterByDays(allOrders, newConfig.kitchen_prep_days);
            const completedOrders = prepOrders.filter(o => o.preparing_at && o.ready_at);
            const prepTimes = completedOrders.map(o => (new Date(o.ready_at).getTime() - new Date(o.preparing_at).getTime()) / 60000);
            const avgPrep = prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0;

            const fullyCompleted = prepOrders.filter(o => o.completed_at && o.created_at);
            const totalTimes = fullyCompleted.map(o => (new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()) / 60000);
            const avgTotal = totalTimes.length > 0 ? totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length : 0;

            const delayedOrdersCount = prepOrders.filter(o => {
                const start = o.preparing_at ? new Date(o.preparing_at).getTime() : null;
                const end = o.ready_at ? new Date(o.ready_at).getTime() : Date.now();
                if (!start) return false;
                return (end - start) / 60000 > 20 && o.status !== "Cancelled";
            }).length;

            const peakOrders = filterByDays(allOrders, newConfig.kitchen_peak_days);
            const peakHours: Record<string, number> = {};
            peakOrders.forEach(o => {
                const hour = new Date(o.created_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: '2-digit', hour12: false }) + ":00";
                peakHours[hour] = (peakHours[hour] || 0) + 1;
            });

            setKitchenStats({
                avgPrepTime: Math.round(avgPrep),
                avgCompletionTime: Math.round(avgTotal),
                delayedOrders: delayedOrdersCount,
                peakLoadHour: Object.entries(peakHours).sort((a, b) => b[1] - a[1])[0]?.[0] || "--:--"
            });

            setRecentOrders(allOrders.slice(0, 5));
        }

        if (tables) {
            setTableSummary({
                available: tables.filter(t => t.status === "Available").length,
                occupied: tables.filter(t => t.status === "Occupied").length,
                reserved: tables.filter(t => t.status === "Reserved").length,
            });
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

    return (
        <div className="space-y-8 relative">
            {loading && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-[var(--color-pizza-red)] animate-pulse font-bold bg-black/80 px-8 py-4 rounded-full border border-white/10 shadow-2xl tracking-widest uppercase text-sm">
                        Synchronizing Matrix...
                    </div>
                </div>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <StatsCard title="Orders" value={stats.totalOrders} icon={ShoppingBag} />
                <StatsCard title="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} />
                <StatsCard title="AOV" value={`₹${Math.round(aov)}`} icon={BarChart} />
                <StatsCard title="Pending" value={stats.pendingOrders} icon={Clock} />
                <StatsCard title="Reservations" value={stats.totalReservations} icon={Calendar} />
                <StatsCard title="Today" value={stats.todayOrders} icon={TrendingUp} />
            </div>

            {/* Kitchen Performance Intelligence */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ChefHat className="text-pizza-red" size={20} />
                            <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Kitchen Performance</CardTitle>
                        </div>
                        <Link href="/admin/kds" className="text-xs text-pizza-red hover:underline font-bold uppercase tracking-widest">Go to KDS →</Link>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard
                            title="Avg Prep Time"
                            value={`${kitchenStats.avgPrepTime}m`}
                            icon={Timer}
                            trend={kitchenStats.avgPrepTime < 15 ? "Optimized" : "Slow"}
                            trendUp={kitchenStats.avgPrepTime < 15}
                        />
                        <StatsCard
                            title="Avg Completion"
                            value={`${kitchenStats.avgCompletionTime}m`}
                            icon={CheckCircle2}
                        />
                        <StatsCard
                            title="Delayed Orders"
                            value={kitchenStats.delayedOrders}
                            icon={AlertCircle}
                            trendUp={false}
                            trend={kitchenStats.delayedOrders > 0 ? "Attention" : "All Clear"}
                        />
                        <StatsCard
                            title="Peak Load"
                            value={kitchenStats.peakLoadHour}
                            icon={TrendingUp}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Live Table Summary */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Utensils className="text-orange-500" size={20} />
                            <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Live Table Occupancy</CardTitle>
                        </div>
                        <Link href="/admin/tables" className="text-xs text-orange-500 hover:underline font-bold uppercase tracking-widest">Manage Tables →</Link>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[120px] p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-500">{tableSummary.available}</p>
                            <p className="text-[10px] text-green-500/70 font-black uppercase tracking-widest mt-1">Available</p>
                        </div>
                        <div className="flex-1 min-w-[120px] p-4 bg-pizza-red/10 border border-pizza-red/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-pizza-red">{tableSummary.occupied}</p>
                            <p className="text-[10px] text-pizza-red/70 font-black uppercase tracking-widest mt-1">Occupied</p>
                        </div>
                        <div className="flex-1 min-w-[120px] p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-blue-500">{tableSummary.reserved}</p>
                            <p className="text-[10px] text-blue-500/70 font-black uppercase tracking-widest mt-1">Reserved</p>
                        </div>
                        <div className="flex-[2] min-w-[200px] p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-around">
                            <div className="text-center">
                                <Users size={20} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 font-bold uppercase">Total Cap.</p>
                                <p className="text-lg font-bold text-white">{tableSummary.available + tableSummary.occupied + tableSummary.reserved}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="text-center">
                                <ChartPie size={20} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 font-bold uppercase">Fill Rate</p>
                                <p className="text-lg font-bold text-white">
                                    {Math.round((tableSummary.occupied / (tableSummary.available + tableSummary.occupied + tableSummary.reserved || 1)) * 100)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Peak Hours & Order Types */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hourly Sales Trend */}
                <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <TrendingUp className="text-[var(--color-pizza-red)]" /> Revenue Analytics
                            </CardTitle>
                        </div>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                            {(['today', '1w', '1m'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setRevenueFilter(f)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        revenueFilter === f
                                            ? "bg-[var(--color-pizza-red)] text-white shadow-lg shadow-[var(--color-pizza-red)]/20"
                                            : "text-gray-500 hover:text-white"
                                    )}
                                >
                                    {f === 'today' ? 'Today' : f === '1w' ? 'Weekly' : 'Monthly'}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 pt-6 h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="hour" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Order Type Distribution */}
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2">
                            <ChartPie className="text-purple-500" size={20} />
                            <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Sales Channels</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 h-[280px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <RePieChart>
                                <Pie
                                    data={orderTypes}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {orderTypes.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#ef4444', '#3b82f6', '#10b981'][index % 3]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4 w-full">
                            {orderTypes.map((type, idx) => (
                                <div key={type.name} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#ef4444', '#3b82f6', '#10b981'][idx % 3] }} />
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{type.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Ordered Items */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Target className="text-[var(--color-pizza-red)]" /> Popular Choices
                        </CardTitle>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 scale-90">
                            {(['today', '1w', '1m'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setTopItemsFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        topItemsFilter === f
                                            ? "bg-[var(--color-pizza-red)] text-white"
                                            : "text-gray-500 hover:text-white"
                                    )}
                                >
                                    {f === 'today' ? 'Day' : f === '1w' ? 'Week' : 'Month'}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {topItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">Waiting for data...</p>
                        ) : (
                            <div className="space-y-6">
                                {topItems.map((item, idx) => {
                                    const maxCount = topItems[0].count;
                                    const percentage = (item.count / maxCount) * 100;
                                    return (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-200 font-medium">#{idx + 1} {item.name}</span>
                                                <span className="text-[var(--color-pizza-red)] font-bold">{item.count} items</span>
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

                {/* Top Customers */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="text-blue-500" /> Loyal Patrons
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {customerFreqs.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">Waiting for regulars...</p>
                        ) : (
                            <div className="space-y-4">
                                {customerFreqs.map((cust) => (
                                    <div key={cust.phone} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold border border-blue-500/20">
                                            {cust.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-200">{cust.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{cust.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white">{cust.count}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Orders</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[9px] text-gray-600 mt-4 text-center font-bold uppercase tracking-widest">
                            * Based on past {config.loyal_patrons_days} days activity
                        </p>
                    </CardContent>
                </Card>

                {/* Hot Locations */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MapPin className="text-purple-500" /> Hot Delivery Zones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {hotLocations.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">Collecting location data...</p>
                        ) : (
                            <div className="space-y-4">
                                {hotLocations.map((loc, idx) => (
                                    <div key={loc.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-gray-500">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-200">{loc.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">{loc.count} successful deliveries</p>
                                        </div>
                                        <div className="text-purple-500">
                                            <MapPin size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[9px] text-gray-600 mt-4 text-center font-bold uppercase tracking-widest">
                            * Performance window: past {config.hot_zones_days} days
                        </p>
                    </CardContent>
                </Card>

                {/* Performance Summary Card */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="text-green-500" /> Daily Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Avg Order Value</p>
                                <p className="text-2xl font-black text-white">₹{Math.round(aov)}</p>
                            </div>
                            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Pending Requests</p>
                                <p className="text-2xl font-black text-white">{stats.pendingOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Map View Integration */}
            <Card className="bg-zinc-900 border border-zinc-800 overflow-hidden">
                <CardHeader className="border-b border-zinc-800/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapIcon className="text-blue-500" size={20} />
                        <CardTitle className="text-white text-lg font-bold uppercase tracking-tight">Order Distribution Map</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 h-[400px] relative">
                    <OrderMap orders={recentOrders} hotLocations={hotLocations} />
                </CardContent>
            </Card>

            {/* Recent Orders Table */}
            <Card className="bg-zinc-900 border border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white uppercase tracking-widest text-[10px] font-black opacity-40">System Transaction Log</CardTitle>
                    <Link
                        href="/admin/orders"
                        className="text-[10px] text-[var(--color-pizza-red)] hover:brightness-125 font-black uppercase tracking-widest transition-all"
                    >
                        Master Inventory View →
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? (
                        <p className="text-gray-400 text-center py-12 font-bold uppercase tracking-widest text-xs opacity-20">Standby for Orders...</p>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 bg-black/40 rounded-2xl hover:bg-black/60 transition-all border border-white/5 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-gray-200 truncate">{order.customer_name}</p>
                                            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
                                                <span className="text-[10px] text-[var(--color-pizza-red)] font-black font-mono tracking-tighter">#{order.id.slice(0, 8)}</span>
                                                <CopyButton text={order.id.slice(0, 8)} className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                                <Clock size={12} className="text-gray-600" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">
                                                <MapPin size={12} className="text-gray-600" />
                                                <span className="truncate max-w-[120px]">{order.address || "Counter"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="text-right">
                                            <p className="font-black text-white text-lg">₹{order.total_amount}</p>
                                            <Badge variant="outline" className={cn(getStatusColor(order.status), "text-[8px] h-4 py-0 font-black border-none")}>
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

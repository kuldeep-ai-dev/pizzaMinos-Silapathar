"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Search,
    Package,
    ChefHat,
    Bike,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
    MapPin
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";

interface OrderItem {
    menu_item_name: string;
    variant_name: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface Order {
    id: string;
    customer_name: string;
    status: OrderStatus;
    total_amount: number;
    created_at: string;
    order_items: OrderItem[];
}

const statusSteps: { status: OrderStatus; icon: any; label: string }[] = [
    { status: "Pending", icon: Clock, label: "Order Placed" },
    { status: "Preparing", icon: ChefHat, label: "Preparing" },
    { status: "Out for Delivery", icon: Bike, label: "On the Way" },
    { status: "Delivered", icon: CheckCircle2, label: "Delivered" },
];

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("");
    const [searchId, setSearchId] = useState("");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    useEffect(() => {
        if (!searchId) return;

        const fetchOrder = async () => {
            setLoading(true);
            setError("");

            try {
                // If it's a full UUID, search directly (most efficient)
                if (searchId.length === 36) {
                    const { data, error: fetchError } = await supabase
                        .from("orders")
                        .select(`*, order_items (*)`)
                        .eq("id", searchId)
                        .maybeSingle();

                    if (fetchError) throw fetchError;
                    if (!data) throw new Error("Order not found");
                    setOrder(data);
                } else {
                    // For short IDs, fetch recent orders and filter locally
                    // This is a robust fallback when we can't query partial UUIDs directly
                    const { data, error: fetchError } = await supabase
                        .from("orders")
                        .select(`*, order_items (*)`)
                        .order('created_at', { ascending: false })
                        .limit(100);

                    if (fetchError) throw fetchError;

                    const matchingOrder = data?.find(o => o.id.toLowerCase().startsWith(searchId.toLowerCase()));
                    if (!matchingOrder) throw new Error("Order not found with this short ID");

                    setOrder(matchingOrder);
                }
            } catch (err: any) {
                console.error("Order fetch error:", err);
                setError(err.message || "Order not found. Please check the ID.");
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        // Real-time subscription
        const channel = supabase
            .channel(`order-${searchId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `id=eq.${searchId}`,
                },
                (payload) => {
                    console.log("Order status updated:", payload.new);
                    setOrder((prev) => prev ? { ...prev, status: payload.new.status } : null);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [searchId, supabase]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = orderId.trim();
        if (trimmed.length < 8) {
            setError("Please enter at least 8 characters of your Order ID.");
            return;
        }
        setSearchId(trimmed);
    };

    const getStatusIndex = (currentStatus: OrderStatus) => {
        if (currentStatus === "Cancelled") return -1;
        return statusSteps.findIndex(s => s.status === currentStatus);
    };

    const statusIndex = order ? getStatusIndex(order.status) : -1;

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] text-white pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-3xl">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-[var(--color-pizza-red)] transition-colors font-bold uppercase tracking-widest text-sm bg-white/5 px-4 py-2 rounded-lg border border-white/10"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </motion.div>

                {/* Header */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-20 h-20 mb-6"
                    >
                        <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </motion.div>
                    <h1 className="text-4xl font-display font-bold text-[var(--color-pizza-red)] mb-2 uppercase tracking-tighter">
                        Track Your Order
                    </h1>
                    <p className="text-gray-400 max-w-md">
                        Enter your Order ID received after checkout to see real-time updates on your pizza journey.
                    </p>
                </div>

                {/* Search Box */}
                <Card className="bg-[var(--color-card-bg)] border-white/10 p-6 mb-8 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[var(--color-pizza-red)] transition-all group-hover:w-3" />
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Enter your 8-digit Order ID..."
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="pl-10 h-14 bg-white/5 border-white/20 text-white focus:ring-[var(--color-pizza-red)] text-lg"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-8 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-bold text-lg hidden sm:flex"
                        >
                            {loading ? "Searching..." : "Track"}
                        </Button>
                    </form>
                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full h-12 mt-4 bg-[var(--color-pizza-red)] text-white sm:hidden"
                    >
                        {loading ? "Searching..." : "Track Order"}
                    </Button>
                    {error && (
                        <p className="text-pizza-red mt-3 text-sm flex items-center gap-1">
                            <XCircle size={14} /> {error}
                        </p>
                    )}
                </Card>

                {/* Tracking Results */}
                <AnimatePresence mode="wait">
                    {order && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            key={order.id}
                            className="space-y-6"
                        >
                            {/* Visual Progress */}
                            <Card className="bg-[var(--color-card-bg)] border-white/10 p-8 shadow-xl">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Order Status</p>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-white tracking-tight">{order.status}</h2>
                                            {order.status === "Cancelled" && (
                                                <Badge variant="destructive" className="animate-pulse">Cancelled</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Badge className="bg-white/10 text-gray-300 py-1.5 px-3 font-mono">
                                        ID: {order.id.slice(0, 8)}
                                    </Badge>
                                </div>

                                {order.status !== "Cancelled" && (
                                    <div className="relative pt-4 pb-8">
                                        {/* Connecting Line */}
                                        <div className="absolute top-[48px] left-[5%] right-[5%] h-1 bg-white/10" />
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${(statusIndex / (statusSteps.length - 1)) * 90}%` }}
                                            className="absolute top-[48px] left-[5%] h-1 bg-[var(--color-pizza-red)] shadow-[0_0_15px_rgba(211,47,47,0.5)]"
                                        />

                                        <div className="flex justify-between relative z-10 w-full">
                                            {statusSteps.map((step, idx) => {
                                                const Icon = step.icon;
                                                const isActive = idx <= statusIndex;
                                                const isCurrent = idx === statusIndex;

                                                return (
                                                    <div key={step.status} className="flex flex-col items-center group">
                                                        <motion.div
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 mb-3 ${isActive
                                                                ? "bg-[var(--color-pizza-red)] border-[var(--color-pizza-red)] text-white"
                                                                : "bg-[var(--color-card-bg)] border-white/10 text-gray-600"
                                                                } ${isCurrent ? "ring-4 ring-[var(--color-pizza-red)]/20 shadow-lg scale-110" : ""}`}
                                                        >
                                                            <Icon size={20} />
                                                        </motion.div>
                                                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-tighter ${isActive ? "text-white" : "text-gray-600"
                                                            }`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Order Details */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="bg-[var(--color-card-bg)] border-white/10 p-6 flex flex-col">
                                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                                        <Package className="text-[var(--color-pizza-red)]" size={18} />
                                        Order Summary
                                    </h3>
                                    <div className="flex-1 space-y-3">
                                        {order.order_items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm border-b border-white/5 pb-2">
                                                <div>
                                                    <p className="font-bold text-gray-200">{item.menu_item_name} x{item.quantity}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">{item.variant_name}</p>
                                                </div>
                                                <p className="font-bold text-white">₹{item.subtotal}</p>
                                            </div>
                                        ))}
                                        {/* Fixed Delivery Charge Display */}
                                        <div className="flex justify-between items-center text-sm pt-1">
                                            <p className="text-gray-400">Delivery Charge</p>
                                            <p className="font-bold text-white">₹30</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-gray-400 font-bold">Grand Total</span>
                                        <span className="text-2xl font-bold text-[var(--color-pizza-red)] font-display">₹{order.total_amount}</span>
                                    </div>
                                </Card>

                                <Card className="bg-[var(--color-card-bg)] border-white/10 p-6">
                                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                                        <MapPin className="text-[var(--color-pizza-red)]" size={18} />
                                        Delivery Info
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Customer Name</p>
                                            <p className="font-bold text-gray-200">{order.customer_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Time Placed</p>
                                            <p className="font-bold text-gray-200">
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {" - "}
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg flex items-center justify-center border border-white/10 gap-3 group hover:bg-[var(--color-pizza-red)]/10 transition-colors cursor-default">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <p className="text-xs text-green-500 font-bold uppercase">Pizza will stay hot!</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="text-center pt-8">
                                <Link
                                    href="/#menu"
                                    className="inline-flex items-center gap-2 text-gray-400 hover:text-[var(--color-pizza-red)] transition-colors font-bold uppercase tracking-widest text-sm"
                                >
                                    <ArrowLeft size={16} /> Back to Menu
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State / Call to action */}
                {!order && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center mt-20 opacity-20 hidden sm:block"
                    >
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-xl font-display uppercase tracking-widest">Awaiting Your Order</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// Minimal ShoppingCart for empty state icon
function ShoppingCart({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
    );
}

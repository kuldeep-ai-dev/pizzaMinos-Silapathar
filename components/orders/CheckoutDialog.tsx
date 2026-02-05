"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, Send, X, CheckCircle2, Banknote, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import CopyButton from "../admin/CopyButton";

const WHATSAPP_NUMBER = "919876543210";

interface CheckoutDialogProps {
    open: boolean;
    onClose: () => void;
}

import { calculateDiscountedPrice, applyCoupon } from "@/utils/pricing";
import { useEffect } from "react";

// ... constants ...

export default function CheckoutDialog({ open, onClose }: CheckoutDialogProps) {
    const { items, clearCart } = useCart();
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        gps: "",
        notes: "",
    });
    const [couponCode, setCouponCode] = useState("");
    const [discount, setDiscount] = useState({ amount: 0, coupon: null as any });
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const DELIVERY_CHARGE = 30;
    const [isSuccess, setIsSuccess] = useState(false);
    const [lastOrderId, setLastOrderId] = useState("");

    // Fetch active campaigns for automatic application
    useEffect(() => {
        if (open) {
            const fetchCampaigns = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from("campaigns")
                    .select("*")
                    .eq("is_active", true);
                setActiveCampaigns(data || []);
            };
            fetchCampaigns();
        }
    }, [open]);

    // Calculate dynamic totals based on current active campaigns
    const totals = items.reduce((acc, item) => {
        // Fallback to item.price if basePrice is missing (for old cart items)
        const priceToUse = item.basePrice || item.price || "0";
        const { original, discounted } = calculateDiscountedPrice(priceToUse, { id: item.menuItemId, category: item.category }, activeCampaigns);

        const originalNum = typeof original === 'number' ? original : parseFloat(String(original).replace(/[^0-9.]/g, "")) || 0;
        const discountedNum = typeof discounted === 'number' ? discounted : parseFloat(String(discounted).replace(/[^0-9.]/g, "")) || 0;

        acc.subtotal += originalNum * item.quantity;
        acc.discountedItemsTotal += discountedNum * item.quantity;
        acc.autoDiscount += (originalNum - discountedNum) * item.quantity;

        return acc;
    }, { subtotal: 0, discountedItemsTotal: 0, autoDiscount: 0 });

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from("campaigns")
            .select("*")
            .eq("code", couponCode.toUpperCase())
            .eq("is_active", true);

        if (data && data.length > 0) {
            // Apply coupon to the sum after automatic offers
            const res = applyCoupon(totals.discountedItemsTotal, couponCode, data as any);
            if (res.coupon) {
                setDiscount({ amount: res.discountAmount, coupon: res.coupon });
            } else {
                alert(res.error);
                setDiscount({ amount: 0, coupon: null });
            }
        } else {
            alert("Invalid or expired coupon code.");
            setDiscount({ amount: 0, coupon: null });
        }
        setValidatingCoupon(false);
    };

    const finalTotal = totals.discountedItemsTotal + DELIVERY_CHARGE - discount.amount;

    const handleGetLocation = () => {
        setLoadingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

                    // Reverse geocode to get address
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();

                        // Extract readable address
                        const address = data.display_name || `${latitude}, ${longitude}`;

                        setFormData((prev) => ({
                            ...prev,
                            gps: mapLink,
                            address: address
                        }));
                    } catch (error) {
                        console.error("Geocoding error:", error);
                        // Fallback to coordinates
                        setFormData((prev) => ({
                            ...prev,
                            gps: mapLink,
                            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                        }));
                    }

                    setLoadingLocation(false);
                },
                (error) => {
                    console.error("Error getting location", error);
                    alert("Could not get location. Please enable GPS.");
                    setLoadingLocation(false);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
            setLoadingLocation(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();

        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert([{
                customer_name: formData.name,
                customer_phone: formData.phone,
                address: formData.address,
                gps_location: formData.gps,
                total_amount: finalTotal,
                discount_amount: totals.autoDiscount + discount.amount,
                coupon_code: discount.coupon?.code || null,
                status: "Pending",
                notes: formData.notes
            }])
            .select()
            .single();

        if (orderError) {
            console.error("Order creation failed:", orderError);
            alert("Failed to place order. Please try again.");
            return;
        }
        // ... rest of item insertion logic

        // 2. Create Order Items
        const orderItems = items.map(item => {
            const priceStr = item.basePrice || item.price || "0";
            const priceNum = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
            return {
                order_id: orderData.id,
                menu_item_name: item.name,
                variant_name: item.variant,
                price: priceNum,
                quantity: item.quantity,
                subtotal: priceNum * item.quantity
            };
        });

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemsError) {
            console.error("Items insertion failed:", itemsError);
            alert("Order placed but items failed to save. Please contact support.");
        } else {
            setLastOrderId(orderData.id.slice(0, 8));
            setIsSuccess(true);
            clearCart();
        }
    };

    if (isSuccess) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 100 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 100 }}
                        className="relative bg-[var(--color-card-bg)] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full text-center overflow-hidden"
                    >
                        {/* Animated background pulse */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[var(--color-pizza-red)]/20 blur-3xl -z-10 rounded-full animate-pulse" />

                        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>
                        </div>

                        <h2 className="text-3xl font-display font-bold text-white mb-2">Thank You!</h2>
                        <p className="text-gray-400 mb-8">Your tasty pizza is on its way. We've received your order.</p>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-8">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Your Order ID</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl font-mono font-bold text-[var(--color-pizza-red)]">{lastOrderId}</span>
                                <CopyButton text={lastOrderId} className="h-8 w-8" />
                            </div>
                            <p className="text-[10px] text-[var(--color-pizza-red)] font-bold mt-2">Save this ID to track your order!</p>
                        </div>

                        <Button
                            onClick={() => {
                                setIsSuccess(false);
                                onClose();
                            }}
                            className="w-full h-14 bg-white text-black hover:bg-gray-100 font-bold text-lg rounded-xl transition-all active:scale-95"
                        >
                            Back to Menu
                        </Button>

                        <div className="mt-6 flex flex-col items-center gap-1 opacity-50">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Powered by</p>
                            <p className="text-xs font-bold text-white tracking-wider">MediaGeny</p>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full h-full sm:h-auto sm:max-w-xl bg-[var(--color-card-bg)] border-0 sm:border sm:border-white/10 sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden sm:max-h-[92vh]"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-[var(--color-card-bg)] border-b border-white/10 p-4 sm:p-6 flex items-center justify-between z-10 shrink-0">
                            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--color-pizza-red)]">Checkout</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                            {/* Detailed Bill Section */}
                            <div className="mb-8 space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1 bg-[var(--color-pizza-red)] rounded-full" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Your Order Summary</h3>
                                </div>
                                <div className="space-y-3">
                                    {items.map((item) => {
                                        const { original, discounted } = calculateDiscountedPrice(
                                            item.basePrice || item.price,
                                            { id: item.menuItemId, category: item.category },
                                            activeCampaigns
                                        );
                                        const origTotal = Number(original) * item.quantity;
                                        const discTotal = Number(discounted) * item.quantity;
                                        const hasItemDiscount = origTotal !== discTotal;

                                        return (
                                            <div key={item.id} className="group relative flex justify-between items-start bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-bold text-base leading-tight">{item.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase tracking-widest">
                                                            Qty: {item.quantity}
                                                        </span>
                                                        {item.variant && (
                                                            <span className="text-[10px] font-medium text-[var(--color-pizza-red)] uppercase tracking-wider">
                                                                {item.variant}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    {hasItemDiscount && (
                                                        <span className="text-[10px] text-gray-500 line-through decoration-[var(--color-pizza-red)]/50">
                                                            ₹{origTotal}
                                                        </span>
                                                    )}
                                                    <span className="text-white font-black text-lg tracking-tighter">
                                                        ₹{discTotal}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {items.length === 0 && (
                                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                        <p className="text-gray-500 italic font-medium">Your delicious box is empty!</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/10 pt-8 mb-6">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                    <User size={14} /> Customer Details
                                </h3>
                            </div>

                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Name</label>
                                    <Input
                                        placeholder="Your Name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/5 border-white/20 text-white h-12 text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                                    <Input
                                        type="tel"
                                        placeholder="10-digit Mobile Number"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-white/5 border-white/20 text-white h-12 text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Delivery Address</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="House No, Street, Landmark"
                                            required={!formData.gps}
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="bg-white/5 border-white/20 text-white h-12 text-base"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGetLocation}
                                            disabled={loadingLocation}
                                            className="whitespace-nowrap bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)] border-[var(--color-pizza-red)]/30 hover:bg-[var(--color-pizza-red)]/20 h-12 px-4"
                                            title="Use Current GPS Location"
                                        >
                                            {loadingLocation ? <Loader2 className="animate-spin w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                    {formData.gps && (
                                        <p className="text-xs text-green-400 flex items-center gap-1">
                                            <MapPin size={12} /> GPS Location Attached
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Cooking Notes (Optional)</label>
                                    <Input
                                        placeholder="No onion, extra spicy, etc."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-white/5 border-white/20 text-white h-12 text-base"
                                    />
                                </div>

                                {/* Coupon Section */}
                                <div className="pt-4 border-t border-white/10 space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Coupon Code</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="ENTER CODE"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white h-12 text-base font-mono uppercase"
                                            disabled={!!discount.coupon}
                                        />
                                        <Button
                                            type="button"
                                            onClick={discount.coupon ? () => setDiscount({ amount: 0, coupon: null }) : handleApplyCoupon}
                                            variant={discount.coupon ? "ghost" : "outline"}
                                            disabled={validatingCoupon}
                                            className={cn(
                                                "h-12 px-6",
                                                discount.coupon ? "text-red-400 hover:text-red-300" : "bg-white/10 text-white"
                                            )}
                                        >
                                            {validatingCoupon ? <Loader2 className="animate-spin" /> : discount.coupon ? "Remove" : "Apply"}
                                        </Button>
                                    </div>
                                    {discount.coupon && (
                                        <p className="text-xs text-green-400 font-bold ml-1 flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Coupon "{discount.coupon.code}" Applied!
                                        </p>
                                    )}
                                </div>
                            </form>

                            {/* Order Summary / Bill Calculation */}
                            <div className="mt-12 bg-black/40 rounded-3xl p-6 border border-white/10 space-y-4 relative overflow-hidden">
                                {/* Subtle decorative pattern */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-pizza-red)]/5 blur-3xl rounded-full -mr-16 -mt-16" />

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-medium">Items Subtotal</span>
                                    <span className="text-white font-bold">₹{totals.subtotal}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-medium">Delivery Charge</span>
                                    <span className="text-white font-bold">₹{DELIVERY_CHARGE}</span>
                                </div>

                                {totals.autoDiscount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-green-400 font-medium">Auto Offer applied</span>
                                        </div>
                                        <span className="text-green-400 font-bold">-₹{totals.autoDiscount}</span>
                                    </div>
                                )}

                                {discount.amount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-green-400 font-black">Coupon Savings</span>
                                        </div>
                                        <span className="text-green-400 font-black">-₹{discount.amount}</span>
                                    </div>
                                )}

                                <div className="pt-5 border-t border-white/10 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Grand Total</span>
                                        <span className="text-base font-bold text-white uppercase tracking-wider">To Pay</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-4xl font-black text-[var(--color-pizza-red)] tracking-tighter drop-shadow-[0_0_20px_rgba(231,76,60,0.3)]">₹{finalTotal}</span>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter mt-1 font-medium">Inclusive of all taxes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer Button */}
                        <div className="p-4 sm:p-6 border-t border-white/10 bg-[var(--color-card-bg)] shrink-0 pb-safe-bottom z-20">
                            <div className="flex items-center gap-3 p-3 mb-4 bg-white/5 rounded-lg border border-white/10">
                                <Banknote className="text-green-500 shrink-0" size={20} />
                                <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">
                                    <span className="text-white font-bold block mb-0.5">Cash on Delivery (COD)</span>
                                    All orders are currently in COD mode. Payment will be collected by the Delivery Boy at your doorstep.
                                </p>
                            </div>
                            <Button
                                type="submit"
                                form="checkout-form"
                                className="w-full h-14 text-lg gap-2 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-bold shadow-lg active:scale-95 transition-transform"
                            >
                                <Send className="w-5 h-5" /> Place Order
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

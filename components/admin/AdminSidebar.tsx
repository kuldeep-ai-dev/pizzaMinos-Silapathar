"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Menu as MenuIcon, X, Calendar, ClipboardList, Radio, LogOut, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { label: "POS / Counter", icon: ShoppingBag, href: "/admin/pos" },
    { label: "Kitchen (KDS)", icon: ChefHat, href: "/admin/kds" },
    { label: "Orders", icon: ClipboardList, href: "/admin/orders" },
    { label: "Tables / QR", icon: LayoutDashboard, href: "/admin/tables" },
    { label: "Reservations", icon: Calendar, href: "/admin/reservations" },
    { label: "Offers & Coupons", icon: Radio, href: "/admin/offers" },
    { label: "Menu Items", icon: ClipboardList, href: "/admin/menu" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    const playNotificationSound = () => {
        // We log regardless of audioEnabled to help with debugging test button
        console.log("🔊 DIGITAL BEEP TRIGGERED");

        try {
            // Generate a clean digital beep (Network independent) using Web Audio API
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Resume context if suspended (browser policy)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);

            // Close context after playback
            setTimeout(() => {
                if (audioCtx.state !== 'closed') audioCtx.close();
            }, 1000);

            console.log("✅ Beep generated successfully");
        } catch (error) {
            console.error("❌ Audio Engine Error:", error);
            // Last resort fallback
            const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_731475775c.mp3");
            audio.play().catch(() => { });
        }
    };

    useEffect(() => {
        const channel = supabase
            .channel("global-admin-alerts")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "orders" },
                (payload) => {
                    console.log("🔔 GLOBAL ORDER RECEIVED:", payload);

                    // Always play sound
                    playNotificationSound();

                    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
                        try {
                            new Notification("New Order Received! 🍕", {
                                body: `Amount: ₹${payload.new.total_amount}`,
                            });
                        } catch (e) {
                            console.error("Browser Notification Error:", e);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log("🌐 Connection Pulse:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--color-card-bg)] border border-white/10 rounded-lg"
            >
                {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen w-72 bg-[var(--color-card-bg)] border-r border-white/10 transition-transform lg:translate-x-0 z-40 flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 flex flex-col h-full">
                    {/* Logo */}
                    <Link href="/admin" className="flex items-center gap-3 mb-10 shrink-0">
                        <div className="w-12 h-12 bg-[var(--color-pizza-red)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-pizza-red)]/20">
                            <span className="text-white font-black text-2xl tracking-tighter">PM</span>
                        </div>
                        <div>
                            <h1 className="font-display font-black text-white text-lg leading-none tracking-tight">PizzaMinos</h1>
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Admin Panel</p>
                        </div>
                    </Link>

                    {/* Navigation - Scrollable */}
                    <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-6">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group",
                                        isActive
                                            ? "bg-[var(--color-pizza-red)] text-white shadow-xl shadow-[var(--color-pizza-red)]/20"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <Icon size={22} className={cn(isActive ? "text-white" : "text-gray-500 group-hover:text-white")} />
                                    <span className="font-bold text-[15px] tracking-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer - Pushed to bottom */}
                    <div className="mt-auto pt-6 border-t border-white/10 space-y-4">

                        <div className="flex flex-col gap-1">
                            <Link
                                href="/kds"
                                target="_blank"
                                className="flex items-center gap-2 px-2 py-1.5 text-xs text-orange-500/60 hover:text-orange-400 transition-colors"
                            >
                                <span className="text-sm">↗</span> Open KDS Station
                            </Link>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                <span className="text-lg">←</span> Back to Website
                            </Link>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("pizza_admin_session");
                                    window.location.href = "/admin/login";
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-500/40 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={14} /> Exit Admin Session
                            </button>
                        </div>

                        <div className="pt-4 mt-2 border-t border-white/5 text-center px-2">
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Geny POS</span>
                                <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span>Powered by</span>
                                    <span className="text-[#0055FF] opacity-80 decoration-[#0055FF]/30">MediaGeny</span>
                                </p>
                                <p className="text-[6px] text-gray-700 font-bold uppercase tracking-[0.1em]">Tech Solutions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                />
            )}
        </>
    );
}

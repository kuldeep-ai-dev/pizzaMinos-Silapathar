"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Menu as MenuIcon, X, Calendar, ClipboardList, Volume2, VolumeX, Radio, LogOut, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { label: "POS / Counter", icon: ShoppingBag, href: "/admin/pos" },
    { label: "Kitchen (KDS)", icon: ChefHat, href: "/admin/kds" },
    { label: "Orders", icon: ClipboardList, href: "/admin/orders" },
    { label: "Tables / QR", icon: LayoutDashboard, href: "/admin/tables" },
    { label: "Reservations", icon: Calendar, href: "/admin/reservations" },
    { label: "Menu Items", icon: ClipboardList, href: "/admin/menu" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('pizza-admin-audio') === 'true';
        }
        return false;
    });
    const [realtimeConnected, setRealtimeConnected] = useState(false);
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
        // Persist setting
        localStorage.setItem('pizza-admin-audio', audioEnabled.toString());

        const channel = supabase
            .channel("global-admin-alerts")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "orders" },
                (payload) => {
                    console.log("🔔 GLOBAL ORDER RECEIVED:", payload);

                    // We check state inside the effect to ensure we use the latest value
                    const isMuted = localStorage.getItem('pizza-admin-audio') !== 'true';
                    if (!isMuted) {
                        playNotificationSound();
                    }

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
                setRealtimeConnected(status === 'SUBSCRIBED');
                console.log("🌐 Connection Pulse:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [audioEnabled]);

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
                    "fixed left-0 top-0 h-screen w-64 bg-[var(--color-card-bg)] border-r border-white/10 p-6 transition-transform lg:translate-x-0 z-40",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <Link href="/admin" className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-[var(--color-pizza-red)] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">PM</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-white">PizzaMinos</h1>
                        <p className="text-xs text-gray-400">Admin Panel</p>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                    isActive
                                        ? "bg-[var(--color-pizza-red)] text-white"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-6 left-6 right-6 space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Alerts Status</span>
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                realtimeConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                            )} />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const newState = !audioEnabled;
                                setAudioEnabled(newState);
                                // Always update storage immediately on click
                                localStorage.setItem('pizza-admin-audio', newState.toString());

                                if (newState) {
                                    // Soft test sound on enable to satisfy autoplay policies
                                    playNotificationSound();

                                    // Also request notification permission
                                    if (typeof window !== 'undefined' && "Notification" in window) {
                                        Notification.requestPermission();
                                    }
                                }
                            }}
                            className={cn(
                                "w-full justify-start gap-2 h-9 p-2 text-xs",
                                audioEnabled ? "text-green-400 hover:text-green-300" : "text-gray-500 hover:text-white"
                            )}
                        >
                            {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                            {audioEnabled ? "Alerts Active" : "Alerts Muted"}
                        </Button>

                        {audioEnabled && (
                            <button
                                onClick={playNotificationSound}
                                className="w-full text-[9px] text-gray-500 hover:text-yellow-500 transition-colors uppercase font-bold tracking-widest mt-1 text-center"
                            >
                                Send Test Alert
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pl-2">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Website
                        </Link>
                        <button
                            onClick={() => {
                                localStorage.removeItem("pizza_admin_session");
                                window.location.href = "/admin/login";
                            }}
                            className="flex items-center gap-2 text-sm text-red-400/60 hover:text-red-400 transition-colors mt-2"
                        >
                            <LogOut size={14} /> Exit Admin Session
                        </button>
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

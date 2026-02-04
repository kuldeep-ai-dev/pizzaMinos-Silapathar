"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Users, Clock, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function BookTablePage() {
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        guests: "2",
        date: "",
        time: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from("reservations")
                .insert([{
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    guest_count: parseInt(formData.guests),
                    reservation_date: formData.date,
                    reservation_time: formData.time,
                    status: "Pending"
                }]);

            if (error) throw error;
            setIsSuccess(true);
        } catch (error: any) {
            console.error("Booking error:", error);
            alert(`Failed to book table: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[var(--color-dark-bg)] flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[var(--color-card-bg)] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Request Received!</h2>
                    <p className="text-gray-400 mb-8">We've received your table reservation request. Our team will contact you shortly to confirm.</p>
                    <Link href="/">
                        <Button className="w-full h-12 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-bold rounded-xl">
                            Back to Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] text-white">
            <Navbar />

            <main className="pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Content Side */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <Badge className="bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)] border-[var(--color-pizza-red)]/20 px-4 py-1">
                                Dine-In Experience
                            </Badge>
                            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
                                Book Your <span className="text-[var(--color-pizza-red)]">Pizza Party</span>
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Skip the wait and secure your spot! Whether it's a family dinner or a quick lunch break, we'll have a hot table waiting for you.
                            </p>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-4 text-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--color-pizza-red)] border border-white/10">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold">Lightning Fast Prep</p>
                                        <p className="text-xs text-gray-400">Table ready exactly at your chosen time.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--color-pizza-red)] border border-white/10">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold">Group Friendly</p>
                                        <p className="text-xs text-gray-400">Accommodations for parties of up to 12 guests.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Form Side */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-pizza-red)]/10 blur-3xl rounded-full -mr-16 -mt-16" />

                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="text-[var(--color-pizza-red)]" /> Reserve a Table
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Full Name</label>
                                        <Input
                                            placeholder="Your Name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-[var(--color-pizza-red)]/50 h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Phone</label>
                                        <Input
                                            type="tel"
                                            placeholder="Contact Number"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-[var(--color-pizza-red)]/50 h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Guests</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg h-12 px-4 focus:ring-1 focus:ring-[var(--color-pizza-red)] outline-none"
                                        value={formData.guests}
                                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                                            <option key={n} value={n.toString()}>{n} Guests</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Date</label>
                                        <Input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-[var(--color-pizza-red)]/50 h-12 [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Time</label>
                                        <Input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-[var(--color-pizza-red)]/50 h-12 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    onClick={() => {
                                        console.log("BOOK TABLE PAGE BUTTON CLICKED");
                                        window.alert("Button clicked on Page! Form should submit.");
                                    }}
                                    disabled={loading}
                                    className="w-full h-14 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-bold text-lg rounded-xl mt-4 shadow-xl shadow-[var(--color-pizza-red)]/20"
                                >
                                    {loading ? "Processing..." : "Confirm Booking"}
                                </Button>
                            </form>

                            <p className="text-[10px] text-center text-gray-500 mt-6 uppercase tracking-widest">
                                By booking, you agree to our dine-in terms.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${className}`}>
            {children}
        </span>
    );
}

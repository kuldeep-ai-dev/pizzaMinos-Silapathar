"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, User, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const Reservation = () => {
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
            setTimeout(() => setIsSuccess(false), 5000); // Reset after 5s
        } catch (error: any) {
            console.error("Booking error:", error);
            alert(`Failed to book table: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="reservation" className="py-20 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[var(--color-card-bg)]/50 -z-10" />

            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <motion.h2
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white uppercase"
                        >
                            Book a <span className="text-[var(--color-pizza-red)]">Table</span>
                        </motion.h2>
                        <p className="text-gray-400 text-base md:text-lg">
                            Reserve your spot for an unforgettable dining experience. Perfect for family gatherings, dates, or parties.
                        </p>

                        <ul className="space-y-4 text-gray-300">
                            <li className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)]">
                                    <Calendar size={20} />
                                </div>
                                <span>Flexible Booking Options</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)]">
                                    <Users size={20} />
                                </div>
                                <span>Groups & Events Welcome</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)]">
                                    <Clock size={20} />
                                </div>
                                <span>Open Daily 10am - 11pm</span>
                            </li>
                        </ul>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <Card className="border-[var(--color-pizza-red)]/20 bg-black/40 backdrop-blur-xl transition-all">
                            <CardContent className="p-8 pt-8 relative overflow-hidden min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {isSuccess ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20"
                                        >
                                            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center border border-green-500/30">
                                                <CheckCircle2 size={40} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">Booking Received!</h3>
                                            <p className="text-gray-400">We'll contact you shortly to confirm your table.</p>
                                        </motion.div>
                                    ) : (
                                        <motion.form
                                            key="form"
                                            onSubmit={handleSubmit}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300 ml-1">Name</label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                                                        <Input
                                                            placeholder="John Doe"
                                                            className="pl-10"
                                                            required
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300 ml-1">Phone</label>
                                                    <Input
                                                        placeholder="+91 98765 43210"
                                                        required
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300 ml-1">Date</label>
                                                    <Input
                                                        type="date"
                                                        className="block w-full cursor-pointer [color-scheme:dark]"
                                                        required
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={formData.date}
                                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300 ml-1">Time</label>
                                                    <Input
                                                        type="time"
                                                        className="block w-full cursor-pointer [color-scheme:dark]"
                                                        required
                                                        value={formData.time}
                                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300 ml-1">Number of Guests</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    placeholder="2 People"
                                                    required
                                                    value={formData.guests}
                                                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                onClick={() => {
                                                    console.log("RESERVATION BUTTON CLICKED");
                                                    window.alert("Button was clicked! Form should submit now.");
                                                }}
                                                disabled={loading}
                                                className="w-full text-lg h-12 mt-4 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90"
                                            >
                                                {loading ? "Processing..." : "Confirm Reservation"}
                                            </Button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Reservation;

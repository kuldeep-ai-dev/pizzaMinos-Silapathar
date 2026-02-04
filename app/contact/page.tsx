"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-[var(--color-dark-bg)] text-white">
            <Navbar />

            <section className="pt-32 pb-20 container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-4"
                >
                    <h1 className="text-5xl md:text-6xl font-display font-bold uppercase">
                        Get in <span className="text-[var(--color-pizza-red)]">Touch</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Have a question, feedback, or want to book a private event? We'd love to hear from you.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* Contact Info & Map */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="grid sm:grid-cols-2 gap-6">
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 space-y-3">
                                    <div className="text-[var(--color-pizza-red)]"><MapPin /></div>
                                    <h3 className="font-bold text-lg">Visit Us</h3>
                                    <p className="text-gray-400 text-sm">Main Market Road,<br />Silapather, Assam - 787059</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 space-y-3">
                                    <div className="text-[var(--color-pizza-red)]"><Phone /></div>
                                    <h3 className="font-bold text-lg">Call Us</h3>
                                    <p className="text-gray-400 text-sm">+91 98765 43210<br />+91 78960 95191</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 space-y-3">
                                    <div className="text-[var(--color-pizza-red)]"><Mail /></div>
                                    <h3 className="font-bold text-lg">Email</h3>
                                    <p className="text-gray-400 text-sm">hello@pizzaminos.com<br />support@pizzaminos.com</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 space-y-3">
                                    <div className="text-[var(--color-pizza-red)]"><Clock /></div>
                                    <h3 className="font-bold text-lg">Hours</h3>
                                    <p className="text-gray-400 text-sm">Mon - Sun: 10:00 AM - 11:00 PM<br />Open on Holidays</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Map Placeholder */}
                        <div className="w-full h-64 rounded-2xl border border-white/10 overflow-hidden bg-gray-800 relative group">
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/40 transition-colors">
                                <span className="text-gray-400 flex items-center gap-2"><MapPin size={16} /> Google Maps Embed Placeholder</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-[var(--color-card-bg)] border-white/10 h-full">
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold font-display">Send us a Message</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Name</label>
                                            <Input placeholder="Your Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Phone</label>
                                            <Input placeholder="Your Number" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Email</label>
                                        <Input type="email" placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Message</label>
                                        <textarea
                                            className="flex w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-pizza-red)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white min-h-[150px]"
                                            placeholder="Tell us what you think..."
                                        />
                                    </div>
                                </div>
                                <Button className="w-full h-12 text-lg gap-2">
                                    <Send size={18} /> Send Message
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

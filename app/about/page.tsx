"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Award, ChefHat, Heart } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[var(--color-dark-bg)] text-white">
            <Navbar />

            {/* Hero Header */}
            <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-[var(--color-dark-bg)] z-10" />
                {/* Abstract Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm" />

                <div className="relative z-20 text-center space-y-4 px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-display font-bold uppercase"
                    >
                        Our <span className="text-[var(--color-pizza-red)]">Story</span>
                    </motion.h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Serving Slice of Heaven in Silapather since 2025
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 container mx-auto px-4 space-y-24">

                {/* Mission Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 text-[var(--color-pizza-red)]">
                            <UtensilsCrossed />
                            <span className="uppercase tracking-widest font-bold text-sm">Who We Are</span>
                        </div>
                        <h2 className="text-4xl font-display font-bold">More Than Just Pizza. <br /> It's an Experience.</h2>
                        <p className="text-gray-400 leading-relaxed">
                            At PizzaMinos, we believe that great food brings people together. Located in the heart of Silapather, we started with a simple mission: to serve the most authentic, mouth-watering Italian pizzas and rich, aromatic Biryanis.
                        </p>
                        <p className="text-gray-400 leading-relaxed">
                            Our chefs use only the freshest locally sourced ingredients, hand-kneaded dough, and secret spice blends to create flavors that explode with every bite. Whether you're here for a quick snack or a grand family dinner, we promise a meal to remember.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                    >
                        {/* Placeholder for Kitchen/Restaurant/Chef Image */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black to-transparent z-10" />
                        <Image src="https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?q=80&w=2062&auto=format&fit=crop" alt="Our Kitchen" fill className="object-cover" />
                    </motion.div>
                </div>

                {/* Values Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: ChefHat, title: "Master Chefs", desc: "Expert culinary artists crafting every dish with passion and precision." },
                        { icon: Heart, title: "Made with Love", desc: "We pour our heart into every recipe, ensuring you feel the warmth of home." },
                        { icon: Award, title: "Quality First", desc: "Premium ingredients, fresh produce, and zero compromise on hygiene." },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                        >
                            <Card className="bg-white/5 border-white/10 hover:border-[var(--color-pizza-red)]/50 transition-colors h-full">
                                <CardContent className="p-8 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)] flex items-center justify-center mx-auto">
                                        <item.icon size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold font-display">{item.title}</h3>
                                    <p className="text-gray-400 text-sm">{item.desc}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}

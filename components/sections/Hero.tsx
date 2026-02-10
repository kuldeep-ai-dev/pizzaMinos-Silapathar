"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
    // Optimized for mobile performance
    return (
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-32 md:pb-0">
            {/* Background Gradient/Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-dark-bg)] via-[#2a0e0e] to-[var(--color-dark-bg)] z-0" />

            {/* Decorative Circles - simplified for mobile */}
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-[var(--color-pizza-red)]/10 rounded-full blur-[100px] hidden md:block" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] hidden md:block" />

            <div className="container relative z-10 px-4 grid md:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center md:text-left space-y-6"
                >
                    <div className="inline-block px-3 py-1 rounded-full border border-[var(--color-pizza-red)]/30 bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)] text-sm font-semibold tracking-wider uppercase mb-2">
                        Authentic Italian Pizza & Biryani
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight uppercase">
                        SLICE OF <span className="text-[var(--color-pizza-red)]">HEAVEN</span> <br />
                        DELIVERED
                    </h1>
                    <p className="text-gray-400 text-base md:text-xl max-w-lg mx-auto md:mx-0 font-medium leading-relaxed">
                        Experience the finest handcrafted pizzas in Silapather. Fresh ingredients, melting cheese, and a taste you can't resist.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
                        <Link href="/#menu" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full text-lg h-14 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90">
                                Order Now
                            </Button>
                        </Link>
                        <Link href="/book-table" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full text-lg h-14 border-white/20 hover:bg-white/10">
                                Reserve a Table
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Visual Content - Optimized for Mobile Scroll */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative flex justify-center items-center"
                >
                    <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[500px] md:h-[500px] gpu-hardware-accelerated">
                        {/* 1. Pulsating Glow Effect - Static on mobile for perf */}
                        <div className="absolute inset-0 bg-[var(--color-pizza-red)]/20 rounded-full blur-[60px] opacity-50 md:animate-pulse" />

                        {/* 2. Outer Orbit Ring (Dashed) - Hidden on mobile if laggy */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/5 animate-spin-slow [animation-duration:30s] hidden sm:block" />

                        {/* 3. Rotating Logo Container */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 md:inset-8 rounded-full border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-[var(--color-pizza-red)]/10 will-change-transform"
                        >
                            <div className="relative w-[85%] h-[85%] group">
                                <Image
                                    src="/logo.png"
                                    alt="PizzaMinos Hero Logo"
                                    fill
                                    className="object-contain drop-shadow-2xl transition-transform duration-500 md:group-hover:scale-105"
                                    priority
                                />
                            </div>
                        </motion.div>

                        {/* 4. Floating Elements - Simplified for Perf */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-0 right-0 md:top-4 md:right-4 z-20"
                        >
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-1 min-w-[100px]">
                                <span className="text-3xl font-bold text-[var(--color-pizza-red)] font-display">30+</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400">Varieties</span>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-4 left-0 md:bottom-10 md:left-4 z-20"
                        >
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-full shadow-xl flex items-center gap-3">
                                <div className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </div>
                                <span className="text-xs font-black text-white tracking-widest uppercase">OPEN NOW</span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;

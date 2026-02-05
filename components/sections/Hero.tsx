"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
    // Enhanced Hero with Glow, Orbit, and Premium Animations
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32 md:pb-0">
            {/* Background Gradient/Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-dark-bg)] via-[#2a0e0e] to-[var(--color-dark-bg)] z-0" />

            {/* Decorative Circles */}
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-[var(--color-pizza-red)]/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />

            <div className="container relative z-10 px-4 grid md:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center md:text-left space-y-6"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block px-3 py-1 rounded-full border border-[var(--color-pizza-red)]/30 bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)] text-sm font-semibold tracking-wider uppercase mb-2"
                    >
                        Authentic Italian Pizza & Biryani
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight">
                        SLICE OF <span className="text-[var(--color-pizza-red)]">HEAVEN</span> <br />
                        DELIVERED
                    </h1>
                    <p className="text-gray-400 text-base md:text-xl max-w-lg mx-auto md:mx-0 font-medium">
                        Experience the finest handcrafted pizzas in Silapather. Fresh ingredients, melting cheese, and a taste you can't resist.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
                        <Link href="/#menu" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full text-lg h-14">
                                Order Now
                            </Button>
                        </Link>
                        <Link href="/book-table" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full text-lg h-14">
                                Reserve a Table
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Visual Content (Enhanced Pizza Logo Animation) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="relative flex justify-center items-center"
                >
                    <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[500px] md:h-[500px]">

                        {/* 1. Pulsating Glow Effect Behind */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-[var(--color-pizza-red)]/20 rounded-full blur-[60px]"
                        />

                        {/* 2. Outer Orbit Ring (Dashed) */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 animate-spin-slow [animation-duration:20s]" />

                        {/* 3. Rotating Logo Container */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 md:inset-8 rounded-full border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-[var(--color-pizza-red)]/10"
                        >
                            {/* Inner Decorative Circle */}
                            <div className="absolute inset-2 md:inset-4 rounded-full border border-white/5" />

                            {/* Logo Image */}
                            <div className="relative w-[85%] h-[85%]">
                                <Image
                                    src="/logo.png"
                                    alt="PizzaMinos Hero Logo"
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>
                        </motion.div>

                        {/* 4. Floating Elements (Enhanced Cards) */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-0 right-0 md:top-4 md:right-4 z-20"
                        >
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-1 min-w-[100px]">
                                <span className="text-3xl font-bold text-[var(--color-pizza-red)] font-display">30+</span>
                                <span className="text-xs uppercase tracking-wider text-gray-300 font-medium">Varieties</span>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-4 left-0 md:bottom-10 md:left-4 z-20"
                        >
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-full shadow-xl flex items-center gap-3">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                                <span className="text-sm font-bold text-white tracking-wide">OPEN NOW</span>
                            </div>
                        </motion.div>

                        {/* 5. Small Orbiting Satellite Icons (Optional Polish) */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 z-10 pointer-events-none"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-6 h-6 bg-[var(--color-pizza-red)] rounded-full blur-md opacity-50" />
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;

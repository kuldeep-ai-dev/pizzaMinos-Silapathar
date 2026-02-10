"use client";

import { motion } from "framer-motion";
import { Hammer, Pizza, Clock } from "lucide-react";
import Link from "next/link"; // Although we might not want navigation in maintenance

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-8"
                >
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border-2 border-dashed border-amber-500/30 rounded-full"
                        />
                        <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center border border-stone-800 shadow-2xl relative overflow-hidden">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            >
                                <Pizza className="w-12 h-12 text-amber-500" />
                            </motion.div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-stone-800 p-2 rounded-full border border-stone-700">
                            <Hammer className="w-5 h-5 text-stone-400" />
                        </div>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-4xl md:text-6xl font-black text-white tracking-tight"
                >
                    We are <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Upgrade-ing</span> our Kitchen
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-lg md:text-xl text-stone-400 max-w-lg mx-auto leading-relaxed"
                >
                    PizzaMinos is currently under maintenance to serve you better. We're polishing the ovens and restocking the freshest ingredients.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <div className="flex items-center gap-2 px-6 py-3 bg-stone-900/50 border border-stone-800 rounded-full text-stone-300">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">We'll be back shortly</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="pt-12 text-sm text-stone-600"
                >
                    &copy; {new Date().getFullYear()} PizzaMinos. All rights reserved.
                </motion.div>
            </div>
        </div>
    );
}

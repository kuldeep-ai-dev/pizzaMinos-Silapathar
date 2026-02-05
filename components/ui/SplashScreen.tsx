"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const SplashScreen = ({ finishLoading, isDataReady }: { finishLoading: () => void; isDataReady: boolean }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timeout = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 2500); // Animation duration: reduced to 2.5 seconds for snappier feel
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (minTimeElapsed && isDataReady) {
            finishLoading();
        }
    }, [minTimeElapsed, isDataReady, finishLoading]);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-dark-bg)] overflow-hidden">
            <div className="relative w-64 h-64 md:w-96 md:h-96">

                {/* 1. Dough Rise Animation */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute inset-0 rounded-full bg-[#f3e5ab] shadow-2xl border-4 border-[#d4af37]/20"
                />

                {/* 2. Slicing Lines (8 Slices) */}
                {[0, 45, 90, 135].map((angle, i) => (
                    <motion.div
                        key={angle}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 0.3 }}
                        transition={{
                            delay: 0.8 + (i * 0.1),
                            duration: 0.5,
                            ease: "easeInOut"
                        }}
                        style={{ rotate: angle }}
                        className="absolute inset-0 m-auto w-full h-[2px] bg-[var(--color-pizza-red)]"
                    />
                ))}

                {/* 3. Pizza Crust Texture/Detail (Subtle) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute inset-4 rounded-full border-8 border-[#c68e17]/10"
                />

                {/* 4. Logo Reveal Popup */}
                <motion.div
                    initial={{ scale: 0, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{
                        delay: 1.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                    className="absolute inset-0 flex items-center justify-center p-8"
                >
                    <div className="relative w-full h-full">
                        <Image
                            src="/logo.png"
                            alt="PizzaMinos Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                        />
                    </div>
                </motion.div>

                {/* 5. Glowing Pulse Effect */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        delay: 2,
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -inset-8 bg-[var(--color-pizza-red)]/10 rounded-full blur-3xl -z-10"
                />

                {/* Text Reveal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 0.5 }}
                    className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-max text-center space-y-2"
                >
                    <h2 className="text-3xl font-display font-bold text-white tracking-[0.2em] uppercase">
                        PIZZAMINOS
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-8 bg-[var(--color-pizza-red)]/50" />
                        <span className="text-[var(--color-pizza-red)] font-bold text-sm tracking-[0.4em] uppercase">
                            & Biryani Hub
                        </span>
                        <div className="h-[1px] w-8 bg-[var(--color-pizza-red)]/50" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SplashScreen;

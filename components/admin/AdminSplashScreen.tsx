"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, ChefHat } from "lucide-react";

export default function AdminSplashScreen({ finishLoading }: { finishLoading: () => void }) {
    const [isMounted, setIsMounted] = useState(false);
    const [phase, setPhase] = useState<"intro" | "welcome">("intro");

    useEffect(() => {
        setIsMounted(true);

        // Step 1: Intro for 3s
        const t1 = setTimeout(() => {
            setPhase("welcome");

            // Step 2: Welcome for 3s
            const t2 = setTimeout(() => {
                finishLoading();
            }, 3000);

            return () => clearTimeout(t2);
        }, 3000);

        return () => clearTimeout(t1);
    }, [finishLoading]);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />

            <AnimatePresence mode="wait">
                {phase === "intro" ? (
                    <motion.div
                        key="intro-phase"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative flex flex-col items-center justify-center text-center"
                    >
                        <motion.h1
                            initial={{ letterSpacing: "1.2em", opacity: 0 }}
                            animate={{ letterSpacing: "0.5em", opacity: 1 }}
                            transition={{ duration: 2.5, ease: "easeOut" }}
                            className="text-6xl md:text-8xl font-black text-white tracking-[0.5em] uppercase"
                        >
                            GENY<span className="text-blue-500">POS</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 1 }}
                            className="mt-12 flex flex-col items-center gap-6"
                        >
                            <div className="h-px w-64 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                            <p className="text-sm md:text-base text-gray-500 font-bold uppercase tracking-[0.4em]">
                                An Unit of <span className="text-gray-300">MEDIAGENY TECH SOLUTIONS</span>
                            </p>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="welcome-phase"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="relative flex flex-col items-center text-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 12 }}
                            className="inline-flex items-center justify-center p-8 bg-blue-600 rounded-[3rem] mb-12 shadow-[0_0_60px_rgba(37,99,235,0.4)] border border-white/20"
                        >
                            <ChefHat className="text-white w-16 h-16" />
                        </motion.div>

                        <div className="space-y-6">
                            <p className="text-xs font-black text-blue-500 uppercase tracking-[0.8em]">System Authorized</p>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight font-display italic tracking-tighter">
                                Welcome <span className="text-blue-500">Pizza Minos</span> to<br />
                                GENY POS Panel
                            </h1>
                            <div className="flex justify-center pt-8">
                                <div className="flex items-center gap-4 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full">
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-60">Synchronizing Datastore</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

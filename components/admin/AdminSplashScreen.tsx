"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminSplashScreen({ finishLoading }: { finishLoading: () => void }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timeout = setTimeout(() => {
            finishLoading();
        }, 7000); // 7 seconds as requested
        return () => clearTimeout(timeout);
    }, [finishLoading]);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />

            <div className="relative flex flex-col items-center gap-12">
                {/* GenyPOS Logo Section */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                        duration: 1.2,
                        ease: [0.16, 1, 0.3, 1]
                    }}
                    className="relative w-72 h-40 md:w-96 md:h-52 flex items-center justify-center"
                >
                    {/* Rotating Decorative Elements */}
                    <div className="absolute inset-0 border border-white/5 rounded-[3rem] animate-pulse [animation-duration:4s]" />

                    {/* Logo Glass Container */}
                    <motion.div
                        initial={{ rotate: -2, scale: 0.95 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="relative w-full h-full bg-gradient-to-tr from-white/5 to-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-10 shadow-[0_0_60px_rgba(59,130,246,0.15)] overflow-hidden group flex items-center justify-center"
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                src={`/genypos_logo.png?v=${Date.now()}`}
                                alt="GenyPOS Logo"
                                className="max-w-full max-h-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                            />
                        </div>
                        {/* Interactive Shine */}
                        <motion.div
                            animate={{
                                left: ["-100%", "200%"],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 1
                            }}
                            className="absolute top-0 w-20 h-full bg-white/10 skew-x-[25deg] blur-xl"
                        />
                    </motion.div>
                </motion.div>

                {/* Text Content */}
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                            Geny<span className="text-blue-500">POS</span>
                        </h1>
                        <p className="text-xs md:text-sm text-gray-300 font-bold uppercase tracking-[0.6em] mt-3">
                            Advanced Management Suite
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 1 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <h2 className="text-xl md:text-2xl font-display font-medium text-white drop-shadow-lg">
                            PizzaMinos <span className="text-blue-500 font-black">Silapathar</span>
                        </h2>
                    </motion.div>
                </div>

                {/* Footer/Powered By */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.5, duration: 0.8 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="flex items-center gap-4 px-8 py-3.5 bg-white/5 border border-white/20 rounded-full backdrop-blur-md shadow-xl">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        <span className="text-sm font-black text-white uppercase tracking-[0.2em]">
                            Syncing Data...
                        </span>
                    </div>

                    <div className="text-center pt-8">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-[0.4em] mb-3">
                            powered by
                        </p>
                        <p className="text-3xl md:text-4xl font-black text-white tracking-[0.1em] drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                            MediaGeny <span className="text-blue-500 font-light italic">tech solutions</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

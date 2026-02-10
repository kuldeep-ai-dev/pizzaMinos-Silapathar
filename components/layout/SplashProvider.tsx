"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/ui/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function SplashProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isDataReady, setIsDataReady] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === "/";

    useEffect(() => {
        if (!isHome) {
            setIsLoading(false);
            return;
        }

        // 1. Check if data is ALREADY ready (race condition prevention)
        if (typeof window !== "undefined" && (window as any).__MENU_DATA_READY__) {
            setIsDataReady(true);
        }

        const handleContentReady = () => {
            setIsDataReady(true);
        };

        window.addEventListener("menuDataReady", handleContentReady);

        // Safety timeout: reduced to 5s for better UX if database is lagging
        const safetyTimeout = setTimeout(() => {
            setIsDataReady(true);
        }, 5000);

        return () => {
            window.removeEventListener("menuDataReady", handleContentReady);
            clearTimeout(safetyTimeout);
        };
    }, [isHome]);

    const handleFinishLoading = () => {
        // Only finish if data is ready OR we're not on home
        if (!isHome || isDataReady) {
            setIsLoading(false);
        }
    };

    // If data ready happens after the 3s splash, trigger finish
    useEffect(() => {
        if (isDataReady && !isLoading && isHome) {
            // Already finished 3s but data was slow? This handles it.
        }
    }, [isDataReady, isLoading, isHome]);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && isHome && (
                    <SplashScreen
                        key="splash"
                        isDataReady={isDataReady}
                        finishLoading={handleFinishLoading}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={isHome ? { opacity: 0 } : { opacity: 1 }}
                animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, ease: "linear" }}
            >
                {children}
            </motion.div>
        </>
    );
}

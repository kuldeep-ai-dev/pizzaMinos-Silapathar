"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/ui/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function SplashProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const isHome = pathname === "/";

    useEffect(() => {
        // We only want the splash screen on the home page for now to avoid annoyance
        if (!isHome) {
            setIsLoading(false);
        }
    }, [isHome]);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && isHome && (
                    <SplashScreen key="splash" finishLoading={() => setIsLoading(false)} />
                )}
            </AnimatePresence>

            <motion.div
                initial={isHome ? { opacity: 0 } : { opacity: 1 }}
                animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </>
    );
}

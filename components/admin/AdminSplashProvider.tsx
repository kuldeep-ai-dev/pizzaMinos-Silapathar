"use client";

import { useState, useEffect } from "react";
import AdminSplashScreen from "./AdminSplashScreen";
import { AnimatePresence, motion } from "framer-motion";

export default function AdminSplashProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <AdminSplashScreen key="admin-splash" finishLoading={() => setIsLoading(false)} />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </>
    );
}

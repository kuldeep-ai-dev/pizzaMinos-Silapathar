"use client";

import { useState, useEffect } from "react";
import AdminSplashScreen from "./AdminSplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AdminSplashProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isInvoice = pathname?.startsWith("/admin/invoice");
    const [isLoading, setIsLoading] = useState(!isInvoice);

    useEffect(() => {
        if (isInvoice) setIsLoading(false);
    }, [isInvoice]);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <AdminSplashScreen key="admin-splash" finishLoading={() => setIsLoading(false)} />
                )}
            </AnimatePresence>

            <motion.div
                initial={isInvoice ? { opacity: 1 } : { opacity: 0 }}
                animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </>
    );
}

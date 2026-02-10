"use client";

import { useState, useEffect, useCallback } from "react";
import AdminSplashScreen from "./AdminSplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/auth-actions";

export default function AdminSplashProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isInvoice = pathname?.startsWith("/admin/invoice");
    const [isLoading, setIsLoading] = useState(!isInvoice);

    // --- SESSION TIMEOUT LOGIC ---
    const TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes

    const handleLogout = useCallback(async () => {
        try {
            await logoutAdmin();
            router.push("/admin/login");
        } catch (error) {
            console.error("Timeout logout failed:", error);
            // Fallback for safety
            window.location.href = "/admin/login";
        }
    }, [router]);

    useEffect(() => {
        // Don't track inactivity on login page
        if (pathname === "/admin/login") return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, TIMEOUT_MS);
        };

        // Events that indicate activity
        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click",
            "keydown"
        ];

        // Initialize timer
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [pathname, handleLogout, TIMEOUT_MS]);

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

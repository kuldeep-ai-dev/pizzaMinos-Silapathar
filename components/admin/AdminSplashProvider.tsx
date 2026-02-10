"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminSplashScreen from "./AdminSplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin, registerAdminSession, pingAdminSession } from "@/lib/auth-actions";

export default function AdminSplashProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isInvoice = pathname?.startsWith("/admin/invoice");
    const [isLoading, setIsLoading] = useState(!isInvoice);
    const sessionIdRef = useRef<string | null>(null);
    const lastPingRef = useRef<number>(0);
    const isInitialMount = useRef(true);

    // --- SESSION TIMEOUT & TRACKING LOGIC ---
    const TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes
    const PING_INTERVAL = 2 * 60 * 1000; // Ping every 2 mins on activity

    const handleLogout = useCallback(async () => {
        try {
            await logoutAdmin(sessionIdRef.current || undefined);
            router.push("/admin/login");
        } catch (error) {
            console.error("Timeout logout failed:", error);
            window.location.href = "/admin/login";
        }
    }, [router]);

    // Session Registration & Heartbeat
    useEffect(() => {
        if (pathname === "/admin/login") return;
        if (!isInitialMount.current) return;
        isInitialMount.current = false;

        const initSession = async () => {
            let sId = localStorage.getItem("pizza_admin_device_id");
            if (!sId) {
                sId = "dev_" + Math.random().toString(36).substring(2, 15);
                localStorage.setItem("pizza_admin_device_id", sId);
            }
            sessionIdRef.current = sId;

            // Safe fetch helper with timeout
            const safeFetch = async (url: string, timeout = 5000) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeout);
                try {
                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(id);
                    return response;
                } catch (e) {
                    clearTimeout(id);
                    throw e;
                }
            };

            try {
                // Fetch Location Data with timeout to prevent blocking
                const res = await safeFetch("https://ipapi.co/json/");
                if (!res.ok) throw new Error("API Response Error");

                const data = await res.json();
                const locationStr = `${data.city || "Unknown City"}, ${data.region || ""}, ${data.country_name || ""}`;

                await registerAdminSession({
                    sessionId: sId,
                    userAgent: navigator.userAgent,
                    ip: data.ip || "Unknown",
                    location: locationStr
                });
            } catch (err) {
                console.warn("Geo-location fetch failed, using fallback tracking:", err);
                await registerAdminSession({
                    sessionId: sId,
                    userAgent: navigator.userAgent,
                    ip: "Local/Protected",
                    location: "Unknown Location"
                });
            }
        };

        initSession();
    }, [pathname]);

    useEffect(() => {
        if (pathname === "/admin/login") return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, TIMEOUT_MS);

            // Throttled Ping
            const now = Date.now();
            if (sessionIdRef.current && now - lastPingRef.current > PING_INTERVAL) {
                pingAdminSession(sessionIdRef.current);
                lastPingRef.current = now;
            }
        };

        const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "keydown"];
        resetTimer();
        events.forEach(event => window.addEventListener(event, resetTimer));

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
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

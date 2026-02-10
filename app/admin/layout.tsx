"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminSupport from "@/components/admin/AdminSupport";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSplashProvider from "@/components/admin/AdminSplashProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Authenticated state is now enforced by Middleware (Server-Side)
    useEffect(() => {
        setIsAuthenticated(true);
    }, []);

    const isInvoice = pathname?.startsWith("/admin/invoice");

    // Content logic
    const content = (
        <div className="min-h-screen bg-[var(--color-dark-bg)] text-white">
            {(!isInvoice && pathname !== "/admin/login") && <AdminSidebar />}
            {!isInvoice && <AdminSupport />}
            <main className={(!isInvoice && pathname !== "/admin/login") ? "lg:ml-72 p-4 sm:p-8" : "p-0"}>
                {children}
            </main>
        </div>
    );

    return (
        <AdminSplashProvider>
            {content}
        </AdminSplashProvider>
    );
}

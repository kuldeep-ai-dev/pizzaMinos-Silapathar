"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSplashProvider from "@/components/admin/AdminSplashProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Simple client-side session check
        const session = localStorage.getItem("pizza_admin_session");

        if (!session && pathname !== "/admin/login") {
            setIsAuthenticated(false);
            router.replace("/admin/login");
        } else {
            setIsAuthenticated(true);
        }
    }, [pathname, router]);

    // Content logic
    const content = (
        <div className="min-h-screen bg-[var(--color-dark-bg)] text-white">
            {pathname !== "/admin/login" && <AdminSidebar />}
            <main className={pathname !== "/admin/login" ? "lg:ml-72 p-4 sm:p-8" : ""}>
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

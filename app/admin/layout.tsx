"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

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

    // Don't show anything (except maybe a loader) until we check auth
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--color-pizza-red)] w-12 h-12" />
            </div>
        );
    }

    // Don't show sidebar on login page
    if (pathname === "/admin/login") {
        return <div className="min-h-screen bg-[var(--color-dark-bg)]">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] text-white">
            <AdminSidebar />
            <main className="lg:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

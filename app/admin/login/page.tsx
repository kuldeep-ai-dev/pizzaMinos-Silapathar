"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/auth-server";
import { verifyAdminLogin } from "@/lib/auth-actions";
import { motion } from "framer-motion";
import { Lock, User, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    // Removed Supabase client from here, we do it on server now

    // Check for session visually (middleware handles enforcement)
    useEffect(() => {
        fetch("/api/auth/check-session?name=pizza_admin_session")
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    router.replace("/admin");
                }
            });
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await verifyAdminLogin(username, password);

        if (result.success) {
            router.replace("/admin");
        } else {
            setError(result.error || "Login failed");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-pizza-red)]/10 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-[var(--color-pizza-red)] rounded-2xl mb-6 shadow-2xl shadow-[var(--color-pizza-red)]/20 border border-white/10">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white tracking-tighter uppercase mb-2">
                        PIZZAMINOS <span className="text-[var(--color-pizza-red)]">SILAPATHAR</span>
                    </h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] opacity-60">
                        Restricted Access Controller
                    </p>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-12 text-white focus:outline-none focus:border-[var(--color-pizza-red)] transition-all placeholder:text-gray-700"
                                        placeholder="Admin identifier"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">
                                    Security Code
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-12 text-white focus:outline-none focus:border-[var(--color-pizza-red)] transition-all placeholder:text-gray-700"
                                        placeholder="Enter passphrase"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-black text-lg rounded-2xl shadow-xl shadow-[var(--color-pizza-red)]/20 border-b-4 border-black/20 group transform active:scale-[0.98] transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        AUTHENTICATE ACCESS <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer Branding */}
                <div className="mt-12 text-center">
                    <a
                        href="https://www.mediageny.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] hover:text-[var(--color-pizza-red)] transition-all"
                    >
                        GenyPOS by MediaGeny Tech Solutions
                    </a>
                </div>
            </motion.div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyStaffLogin, getStaffSession } from "@/lib/auth-staff-actions";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, ChefHat, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CaptainLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const session = await getStaffSession();
            if (session) {
                router.replace("/captain");
            }
            setVerifying(false);
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await verifyStaffLogin(username, password);
            if (result.success) {
                router.replace("/captain");
            } else {
                setError(result.error || "Login failed");
                setLoading(false);
            }
        } catch (err) {
            setError("Server connection failed");
            setLoading(false);
        }
    };

    if (verifying) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-pizza-red)]" /></div>;

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-pizza-red)]/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--color-pizza-red)] to-red-700 rounded-[2rem] mb-6 shadow-2xl shadow-red-900/20 border border-white/10 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <ChefHat size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase mb-2 italic">
                        CAPTAIN <span className="text-[var(--color-pizza-red)]">HUB</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
                        Authorized Staff Gateway
                    </p>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border-t-white/10">
                    <CardContent className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-[var(--color-pizza-red)] text-zinc-700 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <Input
                                        type="text"
                                        required
                                        className="h-14 pl-14 bg-black/40 border-white/5 rounded-2xl text-white placeholder:text-zinc-800 focus:border-[var(--color-pizza-red)]/50 focus:ring-[var(--color-pizza-red)]/20 transition-all font-bold"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Security Key</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-[var(--color-pizza-red)] text-zinc-700 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <Input
                                        type="password"
                                        required
                                        className="h-14 pl-14 bg-black/40 border-white/5 rounded-2xl text-white placeholder:text-zinc-800 focus:border-[var(--color-pizza-red)]/50 focus:ring-[var(--color-pizza-red)]/20 transition-all font-mono tracking-widest text-lg"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/10 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-wider justify-center"
                                    >
                                        <AlertCircle size={14} />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-[var(--color-pizza-red)] hover:bg-red-600 text-white font-black text-sm rounded-2xl shadow-[0_10px_30px_rgba(255,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        INITIALIZE HUB <ArrowRight size={18} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-12 text-center opacity-40">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.4em]">
                        PIZZAMINOS SYSTEM • SECURE STAFF ACCESS
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

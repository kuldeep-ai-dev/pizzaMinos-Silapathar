"use client";

import { useState, useEffect } from "react";
import KDSView from "@/components/kds/KDSView";
import { Lock, ChefHat, KeyRound, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export default function PublicKDSPage() {
    const [password, setPassword] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [correctPass, setCorrectPass] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchPass = async () => {
            const { data, error } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "kds_password")
                .single();

            if (data) {
                setCorrectPass(data.value);
            } else {
                // Fallback / default
                setCorrectPass("1234");
            }
        };

        fetchPass();

        // Check session storage to keep user logged in during the tab session
        const kdsSession = sessionStorage.getItem("kds_auth");
        if (kdsSession === "true") {
            setIsAuthorized(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setError("");

        setTimeout(() => {
            if (password === correctPass) {
                setIsAuthorized(true);
                sessionStorage.setItem("kds_auth", "true");
            } else {
                setError("Incorrect Access Key. Please try again.");
                setPassword("");
            }
            setVerifying(false);
        }, 800);
    };

    if (isAuthorized) {
        return <KDSView />;
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color-pizza-red)]/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 bg-[var(--color-pizza-red)] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)] mb-6">
                            <ChefHat className="text-white w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-display font-black text-white uppercase tracking-tighter mb-2">Kitchen Access</h1>
                        <p className="text-gray-400 font-medium text-sm">Enter access key to initialize KDS station</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-[var(--color-pizza-red)] text-gray-500 transition-colors">
                                <KeyRound size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Access Key"
                                className="block w-full pl-14 pr-5 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-pizza-red)] focus:ring-1 focus:ring-[var(--color-pizza-red)] transition-all font-mono tracking-widest text-lg"
                                required
                                autoFocus
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider justify-center"
                                >
                                    <Lock size={14} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={verifying}
                            className="w-full bg-[var(--color-pizza-red)] hover:bg-red-600 text-white font-black py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(255,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Verifying...
                                </>
                            ) : (
                                "Initialize KDS"
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                            Geny POS • Kitchen Authorization Required
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center opacity-30">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    Powered by MediaGeny Tech Solutions
                </p>
            </div>
        </div>
    );
}

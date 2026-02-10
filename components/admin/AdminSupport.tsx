"use client";

import { useState } from "react";
import {
    HelpCircle,
    Phone,
    Mail,
    MessageSquare,
    X,
    Terminal,
    Send,
    Loader2,
    CheckCircle2,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { sendSystemDiagnostics } from "@/lib/log-actions";

export default function AdminSupport() {
    const [isOpen, setIsOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendLogs = async () => {
        setSending(true);

        // Gather basic diagnostics
        const diagnostics = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            screen: `${window.innerWidth}x${window.innerHeight}`,
            storage: {
                localStorage: Object.keys(localStorage).length,
                sessionStorage: Object.keys(sessionStorage).length
            }
        };

        try {
            await sendSystemDiagnostics(diagnostics);
            setSent(true);
            setTimeout(() => {
                setSent(false);
                setIsOpen(false);
            }, 3000);
        } catch (error) {
            console.error("Failed to send diagnostics:", error);
            alert("Failed to send diagnostics. Please contact support via phone/email.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed top-6 right-6 z-[100]">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-12 h-12 rounded-2xl shadow-2xl transition-all duration-300
                    ${isOpen ? 'bg-zinc-800 rotate-90' : 'bg-[var(--color-pizza-red)] hover:scale-105'}
                `}
                size="icon"
            >
                {isOpen ? <X size={20} /> : <HelpCircle size={20} className="animate-pulse" />}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                        className="absolute top-16 right-0 w-80"
                    >
                        <Card className="bg-zinc-900/90 backdrop-blur-2xl border-white/10 shadow-3xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <MessageSquare size={18} className="text-blue-500" />
                                    </div>
                                    <CardTitle className="text-white text-lg">Support Center</CardTitle>
                                </div>
                                <CardDescription className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                                    MediaGeny Tech Solutions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Contact Methods */}
                                <div className="space-y-2">
                                    <a
                                        href="tel:6901136833"
                                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-[var(--color-pizza-red)]" />
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Phone Support</p>
                                                <p className="text-sm font-black text-white">6901136833</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                                    </a>

                                    <a
                                        href="mailto:support.mediageny@gmail.com"
                                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-blue-400" />
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">General Inquiries</p>
                                                <p className="text-sm font-black text-white">support.mediageny@gmail.com</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>

                                {/* Diagnostics Action */}
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-3 px-1 text-center">
                                        Technical Assistant
                                    </p>
                                    <Button
                                        onClick={handleSendLogs}
                                        disabled={sending || sent}
                                        className={`
                                            w-full h-12 rounded-xl border border-white/5 font-black uppercase tracking-widest text-[10px] transition-all
                                            ${sent ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white'}
                                        `}
                                    >
                                        {sending ? (
                                            <Loader2 className="animate-spin mr-2" size={14} />
                                        ) : sent ? (
                                            <CheckCircle2 className="mr-2" size={14} />
                                        ) : (
                                            <Terminal className="mr-2 opacity-50" size={14} />
                                        )}
                                        {sending ? 'Gathering Logs...' : sent ? 'Diagnostics Sent' : 'Submit System Logs'}
                                    </Button>
                                    <p className="mt-4 text-center">
                                        <a
                                            href="https://www.mediageny.com"
                                            target="_blank"
                                            className="text-[9px] text-zinc-700 hover:text-zinc-400 font-bold uppercase tracking-[0.3em] inline-flex items-center gap-1 transition-colors"
                                        >
                                            www.mediageny.com <ExternalLink size={10} />
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

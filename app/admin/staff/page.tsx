"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    UserPlus,
    Shield,
    Truck,
    Activity,
    Trash2,
    Save,
    History,
    RefreshCw,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StaffManagementPage() {
    const supabase = createClient();
    const [staffList, setStaffList] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        role: "captain",
        phone: ""
    });

    useEffect(() => {
        fetchStaff();
        fetchActivities();

        const staffSub = supabase.channel("staff-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, () => fetchStaff())
            .subscribe();

        const activitySub = supabase.channel("activity-changes")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "staff_activity" }, () => fetchActivities())
            .subscribe();

        return () => {
            supabase.removeChannel(staffSub);
            supabase.removeChannel(activitySub);
        };
    }, []);

    const fetchStaff = async () => {
        const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
        setStaffList(data || []);
        setLoading(false);
    };

    const fetchActivities = async () => {
        const { data } = await supabase
            .from("staff_activity")
            .select("*, staff(name)")
            .order("created_at", { ascending: false })
            .limit(50);
        setActivities(data || []);
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from("staff").insert(formData);
        if (error) {
            alert("Error adding staff: " + error.message);
        } else {
            setIsAdding(false);
            setFormData({ name: "", username: "", password: "", role: "captain", phone: "" });
            fetchStaff();
        }
        setSaving(false);
    };

    const handleDeleteStaff = async (id: string) => {
        if (!confirm("Are you sure? This will remove the staff's access permanently.")) return;
        await supabase.from("staff").delete().eq("id", id);
        fetchStaff();
    };

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <Users className="text-[var(--color-pizza-red)]" /> Staff Matrix
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold opacity-60">Manage your Ground Force & Operations</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-[var(--color-pizza-red)] hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-red-900/20"
                >
                    {isAdding ? "Cancel Matrix Update" : "Add New Operative"}
                </Button>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="bg-white/5 border-white/10 rounded-3xl mb-8">
                            <CardContent className="p-8">
                                <form onSubmit={handleAddStaff} className="grid md:grid-cols-4 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Agent Name"
                                            className="bg-black/40 border-white/5 rounded-xl text-xs h-12"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Username / Access ID</Label>
                                        <Input
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="Access ID"
                                            className="bg-black/40 border-white/5 rounded-xl text-xs h-12"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mobile Contact</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91..."
                                            className="bg-black/40 border-white/5 rounded-xl text-xs h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pass-Key</Label>
                                        <Input
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Matrix Key"
                                            type="password"
                                            className="bg-black/40 border-white/5 rounded-xl text-xs h-12"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Permission Level</Label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl text-xs h-12 px-4 text-white focus:outline-none focus:border-red-500 transition-all font-bold appearance-none"
                                        >
                                            <option value="captain">Floor Captain</option>
                                            <option value="delivery">Delivery Agent</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        <Button type="submit" disabled={saving} className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl w-full md:w-auto">
                                            {saving ? <Loader2 className="animate-spin" /> : "Authorize"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Staff List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 flex items-center gap-2">
                        <Shield size={14} className="text-[var(--color-pizza-red)]" /> Active Operatives
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-500" /></div>
                    ) : staffList.length === 0 ? (
                        <p className="text-zinc-600 font-bold text-center py-20 uppercase tracking-widest text-xs opacity-40">No staff members enlisted.</p>
                    ) : (
                        <div className="grid gap-4">
                            {staffList.map((member) => (
                                <motion.div key={member.id} layout>
                                    <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-all group">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                                    member.role === 'delivery' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                                                )}>
                                                    {member.role === 'delivery' ? <Truck size={20} /> : <Users size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold flex items-center gap-2">
                                                        {member.name}
                                                        {member.phone && <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">({member.phone})</span>}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase border-white/10 text-zinc-500">
                                                            {member.username}
                                                        </Badge>
                                                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                                                            Joined {new Date(member.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase tracking-tighter px-2",
                                                    member.role === 'delivery' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400 border border-white/5"
                                                )}>
                                                    {member.role === 'delivery' ? 'Delivery Boy' : 'Captain'}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteStaff(member.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Log */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 flex items-center gap-2">
                        <Activity size={14} className="text-blue-500" /> Ground Intelligence
                    </h2>
                    <Card className="bg-zinc-900/50 border-white/5 rounded-3xl h-[600px] flex flex-col">
                        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Protocol Feed</CardTitle>
                            <Button variant="ghost" size="icon" onClick={fetchActivities} className="h-6 w-6 text-zinc-600">
                                <RefreshCw size={12} />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 font-mono scrollbar-thin scrollbar-thumb-white/10">
                            {activities.length === 0 ? (
                                <p className="text-center text-[10px] text-zinc-700 py-10">Waiting for activity...</p>
                            ) : (
                                activities.map((log) => (
                                    <div key={log.id} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 group">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase truncate max-w-[120px]">
                                                {log.staff?.name || 'Unknown'}
                                            </span>
                                            <span className="text-[8px] text-zinc-600">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[10px] text-white leading-relaxed">{log.action}</p>
                                        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {log.order_id && (
                                                <Badge className="bg-white/5 text-[8px] border-white/10 hover:bg-white/10 cursor-default">
                                                    Order ID: {log.order_id.slice(0, 8)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

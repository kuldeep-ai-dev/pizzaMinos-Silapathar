"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { createSession, deleteSession } from "@/lib/auth-server";
import { verifyMGLogin } from "@/lib/auth-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldAlert, Database, Key, Save, RefreshCw, Server, Activity, LogOut, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function MGDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState("");
    const supabase = createClient();

    // Settings State
    const [adminUser, setAdminUser] = useState("");
    const [adminPass, setAdminPass] = useState("");
    const [kdsPass, setKdsPass] = useState("");
    const [mgPass, setMgPass] = useState("");

    // Analytics Config State
    const [kitchenPrepDays, setKitchenPrepDays] = useState("7");
    const [kitchenPeakDays, setKitchenPeakDays] = useState("7");
    const [loyalPatronsDays, setLoyalPatronsDays] = useState("30");
    const [hotZonesDays, setHotZonesDays] = useState("30");

    // Status State
    const [maintenanceMode, setMaintenanceMode] = useState(false); // Only visual for now or if we move to DB
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        // We will now rely on Middleware for redirecting, 
        // but we can still check for visual consistency.
        fetchSettings();
        setVerifying(false);
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase.from("app_settings").select("*");
        if (data) {
            data.forEach(item => {
                // We only set usernames or non-sensitive toggles here, 
                // but for dashboard management we can show current ones 
                // since this is already authenticated Master view.
                if (item.key === "admin_username") setAdminUser(item.value);
                if (item.key === "admin_password") setAdminPass(item.value);
                if (item.key === "kds_password") setKdsPass(item.value);
                if (item.key === "mg_password") setMgPass(item.value);

                // Analytics
                if (item.key === "analytics_kitchen_prep_days") setKitchenPrepDays(item.value);
                if (item.key === "analytics_kitchen_peak_days") setKitchenPeakDays(item.value);
                if (item.key === "analytics_loyal_patrons_days") setLoyalPatronsDays(item.value);
                if (item.key === "analytics_hot_zones_days") setHotZonesDays(item.value);
            });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await verifyMGLogin(password);

        if (result.success) {
            setIsAuthenticated(true);
            fetchSettings();
        } else {
            setError(result.error || "Login failed");
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await deleteSession("mg_dashboard_session");
        setIsAuthenticated(false);
        setPassword("");
        window.location.reload(); // Force refresh to trigger middleware check
    };

    const updateSetting = async (key: string, value: string) => {
        setSaving(true);
        setError(""); // Clear previous errors
        console.log(`Attempting to update ${key} to:`, value);

        const { error } = await supabase
            .from("app_settings")
            .upsert({ key, value });

        if (error) {
            console.error(`Update FAILED for ${key}:`, error);
            setError(`Update failed: ${error.message}`);
        } else {
            console.log(`Update SUCCESS for ${key}`);
            setSuccessMsg(`Updated ${key} successfully`);
            setTimeout(() => setSuccessMsg(""), 3000);
            fetchSettings(); // Refresh local state to be sure
        }
        setSaving(false);
    };

    const handleResetData = async (table: string) => {
        if (!confirm(`Are you sure you want to DELETE ALL data from ${table}? This cannot be undone.`)) return;

        setSaving(true);
        const { error } = await supabase
            .from(table)
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (error) {
            alert("Error resetting data: " + error.message);
        } else {
            alert(`${table} cleared successfully.`);
        }
        setSaving(false);
    };

    const handleResetTables = async () => {
        if (!confirm("Reset all tables to 'Available'? This will clear their current status in the matrix.")) return;

        setSaving(true);
        const { error } = await supabase
            .from("res_tables")
            .update({ status: 'Available' })
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
            alert("Error resetting tables: " + error.message);
        } else {
            alert("Table Matrix has been reset to Available.");
        }
        setSaving(false);
    };


    if (verifying) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="text-red-500 w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold">MG Master Access</CardTitle>
                        <CardDescription>Restricted Area for MediaGeny Developers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Master Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black border-zinc-700 text-white"
                                    placeholder="Enter authorization key"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={loading}>
                                {loading ? "Verifying..." : "Access Dashboard"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Database className="text-red-500" />
                        MG Control Center
                    </h1>
                    <p className="text-zinc-500 mt-1">System Administration & Configuration</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" /> Disconnect
                </Button>
            </header>

            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-4 right-4 bg-green-500/10 border border-green-500/20 text-green-500 px-6 py-3 rounded-lg flex items-center gap-2 z-50 backdrop-blur-md"
                    >
                        <CheckCircle2 size={18} />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <Tabs defaultValue="credentials" className="space-y-6">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="credentials">Access Credentials</TabsTrigger>
                    <TabsTrigger value="data" className="data-[state=active]:bg-red-900/20 data-[state=active]:text-red-500">Danger Zone</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="system">System Status</TabsTrigger>
                </TabsList>

                <TabsContent value="credentials" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Admin Panel Config */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Lock className="w-5 h-5 text-blue-500" /> Admin Panel
                                </CardTitle>
                                <CardDescription>Credentials for /admin login</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Username</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={adminUser}
                                            onChange={(e) => setAdminUser(e.target.value)}
                                            className="bg-black/50 border-zinc-700"
                                        />
                                        <Button size="icon" onClick={() => updateSetting("admin_username", adminUser)} disabled={saving}>
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Password</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={adminPass}
                                            onChange={(e) => setAdminPass(e.target.value)}
                                            className="bg-black/50 border-zinc-700"
                                        />
                                        <Button size="icon" onClick={() => updateSetting("admin_password", adminPass)} disabled={saving}>
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KDS Config */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Server className="w-5 h-5 text-orange-500" /> KDS Station
                                </CardTitle>
                                <CardDescription>Credentials for /kds login</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Access Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={kdsPass}
                                            onChange={(e) => setKdsPass(e.target.value)}
                                            className="bg-black/50 border-zinc-700"
                                        />
                                        <Button size="icon" onClick={() => updateSetting("kds_password", kdsPass)} disabled={saving}>
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* MG Dashboard Config */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <ShieldAlert className="w-5 h-5 text-red-500" /> MG Master Key
                                </CardTitle>
                                <CardDescription>Credentials for this dashboard</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Master Password</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={mgPass}
                                            onChange={(e) => setMgPass(e.target.value)}
                                            className="bg-black/50 border-zinc-700"
                                        />
                                        <Button size="icon" onClick={() => updateSetting("mg_password", mgPass)} disabled={saving}>
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
                    <Card className="bg-red-950/10 border-red-900/30">
                        <CardHeader>
                            <CardTitle className="text-red-500 flex items-center gap-2">
                                <ShieldAlert /> Hazardous Operations
                            </CardTitle>
                            <CardDescription className="text-red-500/60">
                                Actions performed here are irreversible. Use with extreme caution.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-red-900/20">
                                <div>
                                    <h4 className="font-bold text-white">Reset All Orders</h4>
                                    <p className="text-sm text-zinc-500">Deletes every order from the database history.</p>
                                </div>
                                <Button variant="destructive" onClick={() => handleResetData('orders')}>
                                    Execute Purge
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-red-900/20">
                                <div>
                                    <h4 className="font-bold text-white">Reset Reservations</h4>
                                    <p className="text-sm text-zinc-500">Deletes all upcoming and past table bookings.</p>
                                </div>
                                <Button variant="destructive" onClick={() => handleResetData('reservations')}>
                                    Execute Purge
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-red-900/20">
                                <div>
                                    <h4 className="font-bold text-white">Reset Table Matrix</h4>
                                    <p className="text-sm text-zinc-500">Forces all tables to 'Available' status.</p>
                                </div>
                                <Button variant="destructive" onClick={handleResetTables}>
                                    Reset Matrix
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2 text-base">
                                    <Activity className="text-purple-500" /> Analytics Matrix
                                </CardTitle>
                                <CardDescription>Configure data aggregation windows for Admin Panel</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 p-4 bg-black/40 rounded-xl border border-zinc-800">
                                    <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Kitchen Performance</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-zinc-500 uppercase">Avg Prep Window (Days)</Label>
                                            <div className="flex gap-2">
                                                <Input value={kitchenPrepDays} onChange={(e) => setKitchenPrepDays(e.target.value)} className="bg-black/50 border-zinc-700 h-8 text-xs" />
                                                <Button size="icon" className="h-8 w-8" onClick={() => updateSetting("analytics_kitchen_prep_days", kitchenPrepDays)} disabled={saving}>
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-zinc-500 uppercase">Peak Load Window (Days)</Label>
                                            <div className="flex gap-2">
                                                <Input value={kitchenPeakDays} onChange={(e) => setKitchenPeakDays(e.target.value)} className="bg-black/50 border-zinc-700 h-8 text-xs" />
                                                <Button size="icon" className="h-8 w-8" onClick={() => updateSetting("analytics_kitchen_peak_days", kitchenPeakDays)} disabled={saving}>
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 p-4 bg-black/40 rounded-xl border border-zinc-800">
                                    <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Consumer Insights</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-zinc-500 uppercase">Loyal Patrons (Days)</Label>
                                            <div className="flex gap-2">
                                                <Input value={loyalPatronsDays} onChange={(e) => setLoyalPatronsDays(e.target.value)} className="bg-black/50 border-zinc-700 h-8 text-xs" />
                                                <Button size="icon" className="h-8 w-8" onClick={() => updateSetting("analytics_loyal_patrons_days", loyalPatronsDays)} disabled={saving}>
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-zinc-500 uppercase">Hot Zones (Days)</Label>
                                            <div className="flex gap-2">
                                                <Input value={hotZonesDays} onChange={(e) => setHotZonesDays(e.target.value)} className="bg-black/50 border-zinc-700 h-8 text-xs" />
                                                <Button size="icon" className="h-8 w-8" onClick={() => updateSetting("analytics_hot_zones_days", hotZonesDays)} disabled={saving}>
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2 text-base">
                                    <Server className="text-blue-500" /> Client Terminal
                                </CardTitle>
                                <CardDescription>Direct link to main operation interface</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 text-center">
                                    <p className="text-zinc-500 text-sm mb-6">To view the active Matrix and real-time orders, please bridge to the Admin Panel.</p>
                                    <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 py-6 font-black uppercase tracking-widest text-[10px]" onClick={() => window.open('/admin', '_blank')}>
                                        Initialize Admin Bridge
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="system">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">System Health & Config</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg bg-black/40 border border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${process.env.NODE_ENV === 'development' ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
                                    <div>
                                        <h4 className="text-white font-medium">Environment</h4>
                                        <p className="text-zinc-500 text-sm uppercase">{process.env.NODE_ENV || 'Development'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="border-green-900 text-green-500">Operational</Badge>
                                </div>
                            </div>

                            <div className="mt-4 p-4 rounded-lg bg-black/40 border border-zinc-800">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Maintenance Mode</h4>
                                    <Badge variant="secondary">Manual Config Required</Badge>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Currently, maintenance mode is controlled via Vercel Environment Variables (`MAINTENANCE_MODE=true`).
                                    To toggle it, update the Env Var in deployment settings.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

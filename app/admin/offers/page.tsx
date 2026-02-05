"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Power, PowerOff, Tag, Percent, Calendar, Target, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Campaign {
    id: string;
    name: string;
    code?: string;
    type: 'percentage' | 'fixed';
    discount_value: number;
    target_type: 'all' | 'category' | 'item';
    target_id?: string;
    is_active: boolean;
    end_date?: string;
}

export default function OffersPage() {
    const supabase = createClient();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [items, setItems] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        code: "",
        type: "percentage",
        discount_value: "",
        target_type: "all",
        target_id: "",
        end_date: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [cRes, catRes, itemRes] = await Promise.all([
            supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
            supabase.from("menu_categories").select("*").order("name"),
            supabase.from("menu_items").select("*").order("name")
        ]);

        setCampaigns(cRes.data || []);
        setCategories(catRes.data || []);
        setItems(itemRes.data || []);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from("campaigns").insert([{
            ...newCampaign,
            discount_value: parseFloat(newCampaign.discount_value),
            code: newCampaign.code || null,
            target_id: newCampaign.target_type === 'all' ? null : newCampaign.target_id,
            end_date: newCampaign.end_date || null
        }]);

        if (error) {
            alert(error.message);
        } else {
            setIsAdding(false);
            setNewCampaign({
                name: "",
                code: "",
                type: "percentage",
                discount_value: "",
                target_type: "all",
                target_id: "",
                end_date: ""
            });
            fetchData();
        }
    };

    const toggleStatus = async (id: string, current: boolean) => {
        await supabase.from("campaigns").update({ is_active: !current }).eq("id", id);
        fetchData();
    };

    const deleteCampaign = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        await supabase.from("campaigns").delete().eq("id", id);
        fetchData();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Offers & Coupons</h1>
                    <p className="text-gray-400">Manage discounts, festive campaigns and promo codes</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="gap-2 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90"
                >
                    {isAdding ? "Cancel" : <><PlusCircle size={18} /> Add New Campaign</>}
                </Button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Create New Offer</CardTitle>
                                <CardDescription>Setup a new discount rule for your customers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Campaign Name</label>
                                        <Input
                                            placeholder="e.g. Festive Diwali Offer"
                                            required
                                            value={newCampaign.name}
                                            onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Coupon Code (Leave empty for Auto-apply)</label>
                                        <Input
                                            placeholder="e.g. PIZZA50"
                                            value={newCampaign.code}
                                            onChange={e => setNewCampaign({ ...newCampaign, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">End Date (Auto-Expiry)</label>
                                        <Input
                                            type="datetime-local"
                                            value={newCampaign.end_date}
                                            onChange={e => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                                            className="[color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Discount Type</label>
                                        <Select
                                            value={newCampaign.type}
                                            onValueChange={(v: string) => setNewCampaign({ ...newCampaign, type: v as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Discount Value</label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 20"
                                            required
                                            value={newCampaign.discount_value}
                                            onChange={e => setNewCampaign({ ...newCampaign, discount_value: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Target Level</label>
                                        <Select
                                            value={newCampaign.target_type}
                                            onValueChange={(v: string) => setNewCampaign({ ...newCampaign, target_type: v as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Global (All Items)</SelectItem>
                                                <SelectItem value="category">Specific Category</SelectItem>
                                                <SelectItem value="item">Specific Item</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {newCampaign.target_type !== 'all' && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Select {newCampaign.target_type === 'category' ? 'Category' : 'Item'}</label>
                                            <Select
                                                value={newCampaign.target_id}
                                                onValueChange={(v: string) => setNewCampaign({ ...newCampaign, target_id: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${newCampaign.target_type}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {newCampaign.target_type === 'category' ? (
                                                        categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)
                                                    ) : (
                                                        items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="lg:col-span-3 flex justify-end">
                                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Create Campaign</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Campaign List */}
            <div className="pt-12 border-t border-white/10">
                <div className="flex items-center gap-3 mb-8">
                    <Tag className="text-[var(--color-pizza-red)]" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Active Campaigns</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-gray-500 animate-pulse">Loading campaigns...</div>
                    ) : campaigns.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                            No active campaigns. Create one to start offering discounts!
                        </div>
                    ) : (
                        campaigns.map(c => (
                            <Card key={c.id} className={cn(
                                "bg-white/5 border-white/10 transition-all",
                                !c.is_active && "opacity-50 grayscale"
                            )}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-[var(--color-pizza-red)]/10 text-[var(--color-pizza-red)] rounded-lg">
                                                {c.code ? <Tag size={16} /> : <Percent size={16} />}
                                            </div>
                                            <CardTitle className="text-lg text-white font-black">{c.name}</CardTitle>
                                        </div>
                                        <Badge variant={c.is_active ? "outline" : "secondary"} className={cn(
                                            "uppercase tracking-tighter font-black",
                                            c.is_active ? "text-green-500 border-green-500/50" : ""
                                        )}>
                                            {c.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-white">
                                            {c.type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                                            <span className="text-xs text-gray-500 ml-2 font-normal uppercase tracking-widest">OFF</span>
                                        </span>
                                        {c.code && (
                                            <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                                                {c.code}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Target size={12} />
                                            <span>Target: <b className="text-gray-200 capitalize">{c.target_type}</b> {c.target_type !== 'all' && `(${c.target_id})`}</span>
                                        </div>
                                        {c.end_date && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Calendar size={12} />
                                                <span>Expires: <b className="text-gray-200">{new Date(c.end_date).toLocaleString()}</b></span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2"
                                            onClick={() => toggleStatus(c.id, c.is_active)}
                                        >
                                            {c.is_active ? <><PowerOff size={14} /> Deactivate</> : <><Power size={14} /> Activate</>}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-500 hover:text-red-500"
                                            onClick={() => deleteCampaign(c.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any) {
    return inputs.filter(Boolean).join(" ");
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuManagement() {
    const supabase = createClient();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Veg Pizza",
        tag: "",
    });

    const fetchMenu = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("menu_items").select("*").order("category");
        if (error) console.error(error);
        else setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert("Name and Price are required");

        if (editingItem) {
            // Update
            const { error } = await supabase
                .from("menu_items")
                .update(formData)
                .eq("id", editingItem.id);
            if (error) alert("Error updating item");
        } else {
            // Insert
            const { error } = await supabase
                .from("menu_items")
                .insert(formData);
            if (error) alert("Error adding item");
        }

        setIsEditing(false);
        setEditingItem(null);
        setFormData({ name: "", description: "", price: "", category: "Veg Pizza", tag: "" });
        fetchMenu();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            const { error } = await supabase.from("menu_items").delete().eq("id", id);
            if (error) alert("Error deleting");
            else fetchMenu();
        }
    };

    const startEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || "",
            price: item.price,
            category: item.category,
            tag: item.tag || ""
        });
        setIsEditing(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Menu <span className="text-[var(--color-pizza-red)]">Management</span></h1>
                    <p className="text-gray-400 mt-1">Add, edit, or remove menu items</p>
                </div>
                <Button onClick={() => setIsEditing(true)} className="bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 gap-2">
                    <Plus size={16} /> Add Item
                </Button>
            </div>

            {/* Edit/Add Form Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--color-card-bg)] p-6 rounded-xl w-full max-w-lg border border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingItem ? "Edit Item" : "Add New Item"}</h2>
                                <button onClick={() => { setIsEditing(false); setEditingItem(null); }}><X /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Item Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Price (e.g. ₹199)</Label>
                                        <Input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full h-10 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-pizza-red)]"
                                        >
                                            <option value="Veg Pizza">Veg Pizza</option>
                                            <option value="Chicken Pizza">Chicken Pizza</option>
                                            <option value="Burgers">Burgers</option>
                                            <option value="Drinks">Drinks</option>
                                            <option value="Sides">Sides</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label>Tag (Optional)</Label>
                                    <Input value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} className="bg-white/5 border-white/20 text-white" />
                                </div>

                                <Button onClick={handleSave} className="w-full bg-[var(--color-pizza-red)]">
                                    <Save size={16} className="mr-2" /> Save Item
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <Card key={item.id} className="bg-white/5 border-white/10">
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardTitle>{item.name}</CardTitle>
                                <span className="text-[var(--color-pizza-red)] font-bold">{item.price}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => startEdit(item)} className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/20">
                                    <Edit2 size={14} className="mr-2" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20">
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

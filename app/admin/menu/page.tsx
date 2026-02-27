"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Settings2, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MenuManagement() {
    const supabase = createClient();
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isManagingCategories, setIsManagingCategories] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        tag: "",
        image_url: ""
    });

    const fetchDropdownData = async () => {
        const { data: catData, error } = await supabase.from("menu_categories").select("*").order("name");

        if (error) {
            console.error("Error fetching categories:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return;
        }

        setCategories(catData || []);
        if (catData && catData.length > 0 && !formData.category) {
            setFormData(prev => ({ ...prev, category: catData[0].name }));
        }

        // Initialize expanded categories
        setExpandedCategories(catData?.map(c => c.name) || []);
    };

    const fetchMenu = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("menu_items").select("*").order("name");
        if (error) {
            console.error("Error fetching menu items:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDropdownData();
        fetchMenu();
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.category) return alert("Name, Price, and Category are required");

        if (editingItem) {
            const { error } = await supabase
                .from("menu_items")
                .update(formData)
                .eq("id", editingItem.id);
            if (error) alert("Error updating item");
        } else {
            const { error } = await supabase
                .from("menu_items")
                .insert(formData);
            if (error) alert("Error adding item");
        }

        setIsEditing(false);
        setEditingItem(null);
        setFormData({ name: "", description: "", price: "", category: categories[0]?.name || "", tag: "", image_url: "" });
        fetchMenu();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            const { error } = await supabase.from("menu_items").delete().eq("id", id);
            if (error) alert("Error deleting");
            else fetchMenu();
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        const { error } = await supabase.from("menu_categories").insert({ name: newCategoryName });
        if (error) {
            if (error.code === '23505') alert("Category already exists");
            else alert("Error adding category");
        } else {
            setNewCategoryName("");
            fetchDropdownData();
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        const itemsInCategory = items.filter(i => i.category === name);
        if (itemsInCategory.length > 0) {
            return alert(`Cannot delete category "${name}" because it contains ${itemsInCategory.length} items. Move them first.`);
        }
        if (confirm(`Delete category "${name}"?`)) {
            await supabase.from("menu_categories").delete().eq("id", id);
            fetchDropdownData();
        }
    };

    const startEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || "",
            price: item.price,
            category: item.category,
            tag: item.tag || "",
            image_url: item.image_url || ""
        });
        setIsEditing(true);
    };

    const toggleCategory = (catName: string) => {
        setExpandedCategories(prev =>
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Menu <span className="text-[var(--color-pizza-red)]">Control</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide uppercase opacity-70">
                        {items.length} dishes across {categories.length} categories
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setIsManagingCategories(true)}
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 h-12 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Settings2 size={16} /> Categories
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({ name: "", description: "", price: "", category: categories[0]?.name || "", tag: "", image_url: "" });
                            setIsEditing(true);
                        }}
                        className="bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 gap-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[var(--color-pizza-red)]/20"
                    >
                        <Plus size={18} /> Add Dish
                    </Button>
                </div>
            </div>

            {/* Category Management Modal */}
            <AnimatePresence>
                {isManagingCategories && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#111] p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Manage Categories</h2>
                                <button onClick={() => setIsManagingCategories(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="text-white/50 hover:text-white" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="New category name..."
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        className="bg-white/5 border-white/10 h-12"
                                    />
                                    <Button onClick={handleAddCategory} className="bg-white text-black font-bold uppercase text-[10px] px-6">
                                        Add
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                            <span className="font-bold text-sm tracking-wide">{cat.name}</span>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-[#111] p-8 rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black uppercase tracking-tighter">
                                    {editingItem ? "Edit" : "Create"} <span className="text-[var(--color-pizza-red)]">Dish</span>
                                </h2>
                                <button onClick={() => { setIsEditing(false); setEditingItem(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="text-white/50 hover:text-white" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Form Left */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Dish Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-white/5 border-white/10 h-12 text-lg font-bold"
                                            placeholder="e.g. Cheese Burst Margherita"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Price (incl. ₹)</Label>
                                        <Input
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="bg-white/5 border-white/10 h-12 font-bold"
                                            placeholder="₹199"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Category</Label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-pizza-red)] appearance-none cursor-pointer"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name} className="bg-[#111]">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Form Right */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Image URL</Label>
                                        <div className="relative">
                                            <Input
                                                value={formData.image_url}
                                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                                className="bg-white/5 border-white/10 h-12 pl-12"
                                                placeholder="https://..."
                                            />
                                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tag / Badge</Label>
                                        <Input
                                            value={formData.tag}
                                            onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                            className="bg-white/5 border-white/10 h-12"
                                            placeholder="Bestseller, Spicy, New"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Description</Label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full h-[90px] bg-white/5 border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-pizza-red)]"
                                            placeholder="Describe the ingredients and taste..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleSave} className="w-full mt-8 h-14 bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[var(--color-pizza-red)]/20">
                                <Save size={20} className="mr-3" /> {editingItem ? "Update Dish" : "Create Dish"}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Menu Sections */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="animate-spin text-[var(--color-pizza-red)]" size={40} />
                    <span className="text-white/40 font-black uppercase tracking-widest text-xs">Syncing Kitchen...</span>
                </div>
            ) : (
                <div className="space-y-8">
                    {categories.map(category => {
                        const categoryItems = items.filter(i => i.category === category.name);
                        const isExpanded = expandedCategories.includes(category.name);

                        return (
                            <div key={category.id} className="space-y-4">
                                <button
                                    onClick={() => toggleCategory(category.name)}
                                    className="flex items-center gap-4 w-full group"
                                >
                                    <div className="h-px bg-white/10 flex-1 group-hover:bg-[var(--color-pizza-red)]/30 transition-colors" />
                                    <div className="flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full border border-white/10 group-hover:border-[var(--color-pizza-red)]/30 transition-all font-black uppercase text-xs tracking-[0.2em]">
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        {category.name} ({categoryItems.length})
                                    </div>
                                    <div className="h-px bg-white/10 flex-1 group-hover:bg-[var(--color-pizza-red)]/30 transition-colors" />
                                </button>

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 pt-2">
                                                {categoryItems.map((item) => (
                                                    <Card key={item.id} className="bg-white/5 border-white/10 overflow-hidden group hover:border-[var(--color-pizza-red)]/50 transition-all duration-500 rounded-2xl">
                                                        <div className="aspect-[16/9] relative overflow-hidden bg-black/40">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="text-white/10" size={40} />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-4 left-4 flex gap-2">
                                                                {item.tag && (
                                                                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                                        {item.tag}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="absolute bottom-4 right-4">
                                                                <span className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-lg font-black tracking-tighter border border-white/10">
                                                                    {item.price}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-xl font-bold tracking-tight text-white group-hover:text-[var(--color-pizza-red)] transition-colors">{item.name}</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-10 font-medium">
                                                                {item.description || "No description provided."}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => startEdit(item)}
                                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-10 font-bold uppercase text-[10px] tracking-widest rounded-xl"
                                                                >
                                                                    <Edit2 size={14} className="mr-2" /> Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 h-10 px-4 rounded-xl"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

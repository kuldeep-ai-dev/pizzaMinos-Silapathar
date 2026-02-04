"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Printer, MapPin, Table as TableIcon, QrCode } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface RestaurantTable {
    id: string;
    table_number: string;
    capacity: number;
    status: "Available" | "Occupied" | "Reserved";
}

export default function AdminTablesPage() {
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingTable, setAddingTable] = useState(false);
    const [newTable, setNewTable] = useState({ table_number: "", capacity: 4 });
    const supabase = createClient();

    const fetchTables = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("res_tables")
            .select("*")
            .order("table_number", { ascending: true });

        if (error) console.error("Error fetching tables:", error);
        else setTables(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingTable(true);
        const { error } = await supabase
            .from("res_tables")
            .insert([newTable]);

        if (error) {
            alert("Error adding table: " + error.message);
        } else {
            setNewTable({ table_number: "", capacity: 4 });
            fetchTables();
        }
        setAddingTable(false);
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm("Are you sure you want to delete this table?")) return;
        const { error } = await supabase
            .from("res_tables")
            .delete()
            .eq("id", id);

        if (error) alert("Error deleting table: " + error.message);
        else fetchTables();
    };

    const handlePrintQR = (table: RestaurantTable) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const baseUrl = window.location.origin;
        const dineInUrl = `${baseUrl}/dine-in/${table.id}`;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - Table ${table.table_number}</title>
                    <style>
                        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { border: 2px solid #ef4444; padding: 40px; border-radius: 20px; text-align: center; max-width: 300px; }
                        .logo { font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 20px; }
                        .table-num { font-size: 48px; font-weight: bold; margin-bottom: 10px; }
                        .instruction { font-size: 14px; color: #666; margin-top: 20px; }
                        .qr-placeholder { margin: 20px 0; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="logo">PIZZAMINOS</div>
                        <div class="table-num">TABLE ${table.table_number}</div>
                        <div id="qr-container" class="qr-placeholder"></div>
                        <div class="instruction">Scan to view menu & order</div>
                    </div>
                    <button class="no-print" style="margin-top: 20px; padding: 10px 20px;" onclick="window.print()">Print Card</button>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        new QRCode(document.getElementById("qr-container"), {
                            text: "${dineInUrl}",
                            width: 200,
                            height: 200
                        });
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="flex min-h-screen bg-[var(--color-dark-bg)]">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white">Table Management</h1>
                            <p className="text-gray-400">Manage restaurant tables and generate QR codes for dine-in.</p>
                        </div>
                    </header>

                    {/* Add Table Form */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Plus className="text-[var(--color-pizza-red)]" /> Add New Table
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddTable} className="flex flex-wrap gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Table Number / Name</label>
                                    <Input
                                        placeholder="e.g. 5, VIP-1"
                                        required
                                        value={newTable.table_number}
                                        onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                                        className="bg-black/20 border-white/10 text-white w-48"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Capacity (Persons)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        required
                                        value={newTable.capacity}
                                        onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                                        className="bg-black/20 border-white/10 text-white w-32"
                                    />
                                </div>
                                <Button type="submit" disabled={addingTable} className="bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 h-10 px-6">
                                    {addingTable ? <Loader2 className="animate-spin w-4 h-4" /> : "Add Table"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Tables Grid */}
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-[var(--color-pizza-red)] w-10 h-10" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {tables.map((table) => (
                                    <motion.div
                                        key={table.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <Card className="bg-white/5 border-white/10 hover:border-[var(--color-pizza-red)]/30 transition-all overflow-hidden group">
                                            <div className="h-2 w-full bg-green-500" style={{ backgroundColor: table.status === 'Occupied' ? '#ef4444' : table.status === 'Reserved' ? '#f59e0b' : '#22c55e' }} />
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-2xl text-white">Table {table.table_number}</CardTitle>
                                                        <CardDescription>Capacity: {table.capacity} Persons</CardDescription>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${table.status === 'Available' ? 'bg-green-500/10 text-green-500' :
                                                            table.status === 'Occupied' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}>
                                                        {table.status}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between gap-4 mt-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePrintQR(table)}
                                                            className="gap-2 border-white/10 hover:bg-white/5 text-xs text-gray-300"
                                                        >
                                                            <QrCode size={14} /> QR Code
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteTable(table.id)}
                                                            className="border-white/10 hover:bg-red-500/10 hover:text-red-500 group-hover:border-red-500/20 text-xs text-gray-400"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                    <div className="bg-white/10 p-2 rounded-lg">
                                                        <QRCodeSVG
                                                            value={`${window.location.origin}/dine-in/${table.id}`}
                                                            size={60}
                                                            level="L"
                                                            includeMargin={false}
                                                            className="opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {tables.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <TableIcon className="mx-auto w-12 h-12 text-gray-600 mb-4" />
                            <h3 className="text-xl text-gray-400 font-bold">No Tables Added</h3>
                            <p className="text-gray-500">Add your first table to get started with dine-in.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

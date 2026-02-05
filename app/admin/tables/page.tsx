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

        // 1. Unlink any orders associated with this table first to avoid constraint errors
        await supabase
            .from("orders")
            .update({ table_id: null })
            .eq("table_id", id);

        // 2. Now delete the table
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
                    <title>QR Poster - Table ${table.table_number}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            margin: 0; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            background: #f0f0f0;
                            min-height: 100vh;
                        }
                        
                        .poster {
                            width: 380px;
                            height: 550px;
                            background-color: #1a1a4a !important;
                            color: white !important;
                            position: relative;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            padding: 24px;
                            font-family: 'Inter', sans-serif;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        /* Decorative Blobs */
                        .blob {
                            position: absolute;
                            background: #ffde00;
                            border-radius: 50%;
                            z-index: 1;
                        }
                        .blob-1 { width: 150px; height: 150px; top: -50px; left: -80px; border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
                        .blob-2 { width: 120px; height: 120px; top: -40px; right: -40px; }
                        .blob-3 { width: 100px; height: 100px; bottom: 120px; left: -50px; border-radius: 30% 70% 70% 30% / 50% 60% 40% 50%; }
                        .blob-4 { width: 140px; height: 140px; bottom: -60px; right: -60px; }

                        .header {
                            position: relative;
                            z-index: 10;
                            text-align: center;
                            margin-top: 10px;
                        }

                        .table-label {
                            font-size: 20px;
                            font-weight: 800;
                            letter-spacing: 2px;
                            margin-bottom: 4px;
                        }

                        .restaurant-name {
                            font-size: 16px;
                            font-weight: 900;
                            letter-spacing: 1px;
                            opacity: 1;
                        }

                        .scan-section {
                            position: relative;
                            z-index: 10;
                            margin-top: 30px;
                            text-align: center;
                        }

                        .scan-now {
                            font-family: 'Luckiest Guy', cursive;
                            font-size: 54px;
                            color: #ffde00;
                            line-height: 1;
                            margin: 0;
                            letter-spacing: 2px;
                            text-shadow: 2px 2px 0px rgba(0,0,0,0.2);
                        }

                        .to-order {
                            font-size: 20px;
                            font-weight: 900;
                            color: white;
                            letter-spacing: 4px;
                            margin-top: -5px;
                        }

                        .qr-container-wrapper {
                            position: relative;
                            z-index: 10;
                            margin-top: 25px;
                            background: rgba(255, 255, 255, 0.05);
                            padding: 25px;
                            border-radius: 40px;
                            border: 1px solid rgba(255,255,255,0.1);
                        }

                        /* Decorative Sparkles */
                        .sparkle {
                            position: absolute;
                            background: #ffde00;
                            width: 6px;
                            height: 20px;
                            border-radius: 10px;
                        }
                        .s1 { top: 10px; left: -15px; transform: rotate(-45deg); }
                        .s2 { top: 40px; left: -25px; transform: rotate(-90deg); }
                        .s3 { top: 70px; left: -15px; transform: rotate(-135deg); }
                        
                        .s4 { bottom: 10px; right: -15px; transform: rotate(-45deg); }
                        .s5 { bottom: 40px; right: -25px; transform: rotate(-90deg); }
                        .s6 { bottom: 70px; right: -15px; transform: rotate(-135deg); }

                        .qr-frame {
                            background: white;
                            padding: 12px;
                            border-radius: 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                            width: fit-content;
                            margin: 0 auto;
                        }

                        .genypos {
                            margin-top: 20px;
                            font-weight: 900;
                            font-size: 16px;
                            letter-spacing: 6px;
                            color: white;
                            text-align: center;
                            width: 100%;
                        }
                        .genypos span { color: #cc74ff; }

                        .footer-bar {
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            background: #121235;
                            padding: 20px 10px;
                            text-align: center;
                            z-index: 10;
                        }

                        .url {
                            color: #ffde00;
                            font-size: 11px;
                            font-weight: 700;
                            margin-bottom: 8px;
                            letter-spacing: 1px;
                        }

                        .powered-by {
                            color: white;
                            font-size: 11px;
                            font-weight: 800;
                        }
                        .powered-by span { opacity: 0.7; font-weight: 400; }

                        @media print {
                            body { background: white; margin: 0; }
                            .poster { box-shadow: none; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="poster">
                        <div class="blob blob-1"></div>
                        <div class="blob blob-2"></div>
                        <div class="blob blob-3"></div>
                        <div class="blob blob-4"></div>

                        <div class="header">
                            <div class="table-label">TABLE: ${table.table_number}</div>
                            <div class="restaurant-name">PIZZAMINOS SILAPATHAR</div>
                        </div>

                        <div class="scan-section">
                            <h1 class="scan-now">SCAN HERE</h1>
                            <div class="to-order">TO ORDER</div>
                        </div>

                        <div class="qr-container-wrapper">
                            <div class="sparkle s1"></div>
                            <div class="sparkle s2"></div>
                            <div class="sparkle s3"></div>
                            <div class="sparkle s4"></div>
                            <div class="sparkle s5"></div>
                            <div class="sparkle s6"></div>
                            
                            <div class="qr-frame">
                                <div id="qr-container"></div>
                            </div>
                            
                            <div class="genypos">GENY<span>POS</span></div>
                        </div>

                        <div class="footer-bar">
                            <div class="url">www.pizzaminos.mediageny.com</div>
                            <div class="powered-by">Powered by <span>MediaGeny Tech Solutions</span></div>
                        </div>
                    </div>

                    <div class="no-print" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100;">
                        <button style="padding: 12px 30px; background: #1a1a4a; color: white; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" onclick="window.print()">Print Poster</button>
                    </div>

                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        new QRCode(document.getElementById("qr-container"), {
                            text: "${dineInUrl}",
                            width: 160,
                            height: 160,
                            colorDark: "#1a1a4a",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintAllQR = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const baseUrl = window.location.origin;

        const postersHtml = tables.map(table => {
            const dineInUrl = `${baseUrl}/dine-in/${table.id}`;
            return `
                <div class="poster-wrapper">
                    <div class="poster">
                        <div class="blob blob-1"></div>
                        <div class="blob blob-2"></div>
                        <div class="blob blob-3"></div>
                        <div class="blob blob-4"></div>

                        <div class="header">
                            <div class="table-label">TABLE: ${table.table_number}</div>
                            <div class="restaurant-name">PIZZAMINOS SILAPATHAR</div>
                        </div>

                        <div class="scan-section">
                            <h1 class="scan-now">SCAN HERE</h1>
                            <div class="to-order">TO ORDER</div>
                        </div>

                        <div class="qr-container-wrapper">
                            <div class="sparkle s1"></div>
                            <div class="sparkle s2"></div>
                            <div class="sparkle s3"></div>
                            <div class="sparkle s4"></div>
                            <div class="sparkle s5"></div>
                            <div class="sparkle s6"></div>
                            
                            <div class="qr-frame">
                                <div id="qr-${table.id}"></div>
                            </div>
                            
                            <div class="genypos">GENY<span>POS</span></div>
                        </div>

                        <div class="footer-bar">
                            <div class="url">www.pizzaminos.mediageny.com</div>
                            <div class="powered-by">Powered by <span>MediaGeny Tech Solutions</span></div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print All QR Posters</title>
                    <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4 landscape;
                            margin: 0;
                        }
                        body { 
                            margin: 0; 
                            background: #f0f0f0;
                        }
                        
                        .grid-container {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0;
                            width: 100%;
                        }

                        .poster-wrapper {
                            height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            break-inside: avoid;
                        }

                        .poster {
                            width: 380px;
                            height: 550px;
                            background-color: #1a1a4a !important;
                            color: white !important;
                            position: relative;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            padding: 24px;
                            font-family: 'Inter', sans-serif;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            transform: scale(1.05); /* Slight scale to fit A4 better */
                        }

                        .blob { position: absolute; background: #ffde00; border-radius: 50%; z-index: 1; }
                        .blob-1 { width: 150px; height: 150px; top: -50px; left: -80px; border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
                        .blob-2 { width: 120px; height: 120px; top: -40px; right: -40px; }
                        .blob-3 { width: 100px; height: 100px; bottom: 120px; left: -50px; border-radius: 30% 70% 70% 30% / 50% 60% 40% 50%; }
                        .blob-4 { width: 140px; height: 140px; bottom: -60px; right: -60px; }

                        .header { position: relative; z-index: 10; text-align: center; margin-top: 10px; }
                        .table-label { font-size: 20px; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; }
                        .restaurant-name { font-size: 16px; font-weight: 900; letter-spacing: 1px; }

                        .scan-section { position: relative; z-index: 10; margin-top: 30px; text-align: center; }
                        .scan-now { font-family: 'Luckiest Guy', cursive; font-size: 54px; color: #ffde00; line-height: 1; margin: 0; letter-spacing: 2px; text-shadow: 2px 2px 0px rgba(0,0,0,0.2); }
                        .to-order { font-size: 20px; font-weight: 900; color: white; letter-spacing: 4px; margin-top: -5px; }

                        .qr-container-wrapper { position: relative; z-index: 10; margin-top: 25px; background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.1); width: fit-content; }
                        .sparkle { position: absolute; background: #ffde00; width: 6px; height: 20px; border-radius: 10px; }
                        .s1 { top: 10px; left: -15px; transform: rotate(-45deg); }
                        .s2 { top: 40px; left: -25px; transform: rotate(-90deg); }
                        .s3 { top: 70px; left: -15px; transform: rotate(-135deg); }
                        .s4 { bottom: 10px; right: -15px; transform: rotate(-45deg); }
                        .s5 { bottom: 40px; right: -25px; transform: rotate(-90deg); }
                        .s6 { bottom: 70px; right: -15px; transform: rotate(-135deg); }

                        .qr-frame { background: white; padding: 12px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,0,0,0.1); width: fit-content; margin: 0 auto; }
                        .genypos { margin-top: 20px; font-weight: 900; font-size: 16px; letter-spacing: 6px; color: white; text-align: center; width: 100%; }
                        .genypos span { color: #cc74ff; }

                        .footer-bar { position: absolute; bottom: 0; left: 0; right: 0; background: #121235; padding: 20px 10px; text-align: center; z-index: 10; }
                        .url { color: #ffde00; font-size: 11px; font-weight: 700; margin-bottom: 8px; letter-spacing: 1px; }
                        .powered-by { color: white; font-size: 11px; font-weight: 800; }
                        .powered-by span { opacity: 0.7; font-weight: 400; }

                        @media print {
                            body { background: white; margin: 0; }
                            .poster { box-shadow: none; }
                            .no-print { display: none; }
                            .poster-wrapper { height: 100vh; }
                        }
                    </style>
                </head>
                <body>
                    <div class="grid-container">
                        ${postersHtml}
                    </div>

                    <div class="no-print" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100;">
                        <button style="padding: 12px 30px; background: #1a1a4a; color: white; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" onclick="window.print()">Print all ${tables.length} posters</button>
                    </div>

                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        ${tables.map(table => `
                            new QRCode(document.getElementById("qr-${table.id}"), {
                                text: "${baseUrl}/dine-in/${table.id}",
                                width: 160,
                                height: 160,
                                colorDark: "#1a1a4a",
                                colorLight: "#ffffff",
                                correctLevel: QRCode.CorrectLevel.H
                            });
                        `).join("")}
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
                        <Button
                            onClick={handlePrintAllQR}
                            disabled={tables.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-full gap-2 flex items-center shadow-lg transition-all active:scale-95"
                        >
                            <Printer size={18} /> Print All Cards
                        </Button>
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

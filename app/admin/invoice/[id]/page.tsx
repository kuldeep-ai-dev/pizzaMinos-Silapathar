"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoicePage() {
    const { id } = useParams();
    const supabase = createClient();
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!id) return;
            setLoading(true);

            // Fetch Order
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select("*")
                .eq("id", id)
                .single();

            if (orderError) {
                console.error("Error fetching order:", orderError);
                setLoading(false);
                return;
            }

            // Fetch Items
            const { data: itemsData, error: itemsError } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", id);

            if (itemsError) {
                console.error("Error fetching items:", itemsError);
            }

            setOrder(orderData);
            setItems(itemsData || []);
            setLoading(false);
        };

        fetchOrderDetails();
    }, [id]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!order) {
        return <div className="text-center py-20">Order not found</div>;
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white text-black p-4 sm:p-8 font-mono">
            {/* Thermal Printer Specific Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    header, footer, nav, aside {
                        display: none !important;
                    }
                    .thermal-invoice {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 10px !important;
                        border: none !important;
                        box-shadow: none !important;
                        float: none !important;
                    }
                    * {
                        background: transparent !important;
                        color: black !important;
                        text-shadow: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            <div className="max-w-md mx-auto thermal-invoice border border-gray-100 p-6 rounded-2xl shadow-sm bg-white print:shadow-none print:border-none print:p-0">
                {/* Actions (Hidden on Print) */}
                <div className="mb-8 no-print flex justify-end">
                    <Button onClick={handlePrint} className="gap-2 bg-black text-white hover:bg-black/90">
                        <Printer size={16} /> Print Receipt
                    </Button>
                </div>

                {/* Invoice Header */}
                <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
                    <h1 className="text-2xl font-black uppercase tracking-tighter">PizzaMinos</h1>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1">Silapathar, Assam</p>
                    <p className="text-[10px] font-bold">+91 99540 50359</p>
                </div>

                {/* Order Details */}
                <div className="mb-6 text-[11px] space-y-1">
                    <div className="flex justify-between">
                        <span className="uppercase font-bold">Order ID:</span>
                        <span className="font-bold">#{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="uppercase">Date:</span>
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-black/10 mt-2">
                        <div className="flex justify-between">
                            <span className="uppercase font-bold text-sm">Customer: {order.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="">Contact: {order.customer_phone}</span>
                        </div>
                    </div>

                    {order.order_type === 'Dine-in' && (
                        <div className="mt-4 pt-3 border-t-2 border-dashed border-black flex justify-between items-end">
                            <div className="font-black uppercase text-xs">Table Service</div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-black leading-none tracking-tighter">
                                    T-{order.address?.match(/Table (\w+)/)?.[1] || '??'}
                                </span>
                            </div>
                        </div>
                    )}

                    {(order.order_type === 'Delivery' || !order.order_type) && order.address && (
                        <div className="mt-4 pt-3 border-t border-black">
                            <span className="font-bold uppercase block mb-1">Delivery To:</span>
                            <p className="leading-tight font-bold">{order.address}</p>
                        </div>
                    )}

                    {order.order_type === 'Counter' && (
                        <div className="mt-4 pt-3 border-t-2 border-dashed border-black text-center font-bold tracking-widest text-[10px]">
                            *** COUNTER SALE ***
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <table className="w-full text-[11px] mb-4 border-collapse">
                    <thead className="border-y border-black border-dashed">
                        <tr>
                            <th className="text-left py-2 uppercase">Item</th>
                            <th className="text-center py-2 uppercase">Qty</th>
                            <th className="text-right py-2 uppercase">Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-black/10">
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="py-2">
                                    <div className="font-bold leading-tight uppercase">{item.menu_item_name}</div>
                                    {item.variant_name && <div className="text-[9px] lowercase italic opacity-80">[{item.variant_name}]</div>}
                                </td>
                                <td className="text-center py-2 font-bold">{item.quantity}</td>
                                <td className="text-right py-2 font-bold">₹{item.subtotal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-black pt-2 mb-8">
                    <div className="flex justify-between font-black text-xl tracking-tighter">
                        <span className="uppercase">Grand Total</span>
                        <span>₹{order.total_amount}</span>
                    </div>
                    <div className="text-[9px] text-right mt-1 opacity-60">Inclusive of all taxes</div>
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] space-y-2 border-t border-dashed border-black pt-4">
                    <p className="font-bold uppercase tracking-widest">Thank you for ordering!</p>
                    <p className="italic lowercase">Visit us again: pizzaminos.mediageny.com</p>
                    <div className="pt-4 flex flex-col items-center">
                        <p className="uppercase tracking-[0.3em] text-[8px] opacity-40 mb-1">POS Powered by</p>
                        <p className="font-black text-black text-xs tracking-tighter">MediaGeny Tech Solutions</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

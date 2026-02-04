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
        <div className="min-h-screen bg-white text-black p-8 font-mono">
            <div className="max-w-md mx-auto print:max-w-full">
                {/* Actions (Hidden on Print) */}
                <div className="mb-8 print:hidden flex justify-end">
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer size={16} /> Print Invoice
                    </Button>
                </div>

                {/* Invoice Header */}
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-widest">PizzaMinos</h1>
                    <p className="text-sm text-gray-600">Delicious Pizza & Biryani</p>
                    <p className="text-xs text-gray-500 mt-1">Silapather, Assam</p>
                    <p className="text-xs text-gray-500">Phone: +91 99540 50359</p>
                </div>

                {/* Order Details */}
                <div className="mb-6 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Order ID</span>
                        <span className="font-bold">#{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Date</span>
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 mt-2">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-[var(--color-pizza-red)] uppercase text-[10px] tracking-widest">Customer</span>
                            <span className="font-bold text-lg">{order.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Contact</span>
                            <span className="font-bold">{order.customer_phone}</span>
                        </div>
                    </div>

                    {order.order_type === 'Dine-in' && (
                        <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded">Dine In</span>
                            <div className="text-right">
                                <span className="block text-[8px] uppercase font-bold text-gray-400">Restaurant Seat</span>
                                <span className="text-4xl font-black text-black leading-none">
                                    #{order.address?.match(/Table (\w+)/)?.[1] || '??'}
                                </span>
                            </div>
                        </div>
                    )}

                    {(order.order_type === 'Delivery' || !order.order_type) && order.address && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <span className="font-bold text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Delivery Address</span>
                            <p className="text-xs text-gray-700 leading-relaxed font-bold">{order.address}</p>
                        </div>
                    )}

                    {order.order_type === 'Counter' && (
                        <div className="mt-4 pt-3 border-t border-gray-200 text-center italic text-gray-500 text-xs">
                            Takeaway / Counter Sale
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <table className="w-full text-sm mb-4">
                    <thead className="border-b border-black">
                        <tr>
                            <th className="text-left py-1">Item</th>
                            <th className="text-center py-1">Qty</th>
                            <th className="text-right py-1">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-dotted border-gray-300">
                                <td className="py-2">
                                    <div className="font-bold">{item.menu_item_name}</div>
                                    {item.variant_name && <div className="text-xs text-gray-500">({item.variant_name})</div>}
                                </td>
                                <td className="text-center py-2">{item.quantity}</td>
                                <td className="text-right py-2">₹{item.subtotal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-black pt-2 mb-8">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>₹{order.total_amount}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 space-y-1">
                    <p>Thank you for ordering!</p>
                    <p>Visit us at pizzaminos.com</p>
                    <div className="pt-4 border-t border-gray-100 mt-4">
                        <p className="uppercase tracking-[0.2em] text-[10px] opacity-70">Powered by</p>
                        <p className="font-bold text-black text-[11px]">MediaGeny</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

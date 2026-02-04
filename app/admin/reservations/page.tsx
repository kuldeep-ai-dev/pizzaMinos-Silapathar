"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, Check, X, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Reservation {
    id: string;
    customer_name: string;
    customer_phone: string;
    guest_count: number;
    reservation_date: string;
    reservation_time: string;
    status: string;
    created_at: string;
}

export default function AdminReservations() {
    const supabase = createClient();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        console.log("Fetching reservations...");
        const { data, error } = await supabase
            .from("reservations")
            .select("*")
            .order("reservation_date", { ascending: false });

        if (error) {
            console.error("Fetch reservations error:", error);
        }
        if (data) setReservations(data);
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        console.log(`Updating reservation ${id} to ${status}...`);
        const { error } = await supabase
            .from("reservations")
            .update({ status })
            .eq("id", id);

        if (!error) {
            setReservations(prev =>
                prev.map(r => r.id === id ? { ...r, status } : r)
            );
        } else {
            console.error("Update error:", error);
            alert("Failed to update reservation: " + error.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
            case "Confirmed": return "bg-green-500/20 text-green-500 border-green-500/50";
            case "Cancelled": return "bg-red-500/20 text-red-500 border-red-500/50";
            default: return "bg-gray-500/20 text-gray-500";
        }
    };

    const filteredReservations = reservations.filter(r =>
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_phone.includes(searchTerm)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Reservations</h1>
                    <p className="text-gray-400">Manage your table bookings and guest requests</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <Input
                        placeholder="Search guests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex items-center justify-center p-20 text-[var(--color-pizza-red)] font-bold animate-pulse">
                        Loading Reservations...
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <Card className="bg-white/5 border-white/10 p-12 text-center text-gray-500">
                        No reservations found
                    </Card>
                ) : (
                    filteredReservations.map((res) => (
                        <Card key={res.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row justify-between gap-6">
                                    {/* Left Side: Guest Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-pizza-red)]/10 flex items-center justify-center text-[var(--color-pizza-red)] border border-[var(--color-pizza-red)]/20 text-xl font-bold">
                                                {res.customer_name[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{res.customer_name}</h3>
                                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-500" /> {res.customer_phone}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                                            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                <Calendar size={16} className="text-[var(--color-pizza-red)]" />
                                                <span>{new Date(res.reservation_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                <Clock size={16} className="text-[var(--color-pizza-red)]" />
                                                <span>{res.reservation_time.slice(0, 5)}</span>
                                            </div>
                                            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                <Users size={16} className="text-[var(--color-pizza-red)]" />
                                                <span>{res.guest_count} Guests</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Actions */}
                                    <div className="flex flex-row lg:flex-col items-center justify-end gap-3 min-w-[150px]">
                                        <Badge variant="outline" className={`${getStatusColor(res.status)} h-8 px-4 font-bold tracking-widest text-[10px]`}>
                                            {res.status.toUpperCase()}
                                        </Badge>

                                        <div className="flex gap-2">
                                            {res.status === "Pending" && (
                                                <>
                                                    <Button
                                                        onClick={() => updateStatus(res.id, "Confirmed")}
                                                        className="bg-green-600 hover:bg-green-700 h-10 px-4 rounded-xl font-bold gap-2"
                                                    >
                                                        <Check size={18} /> Confirm
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => updateStatus(res.id, "Cancelled")}
                                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 h-10 px-4 rounded-xl font-bold gap-2"
                                                    >
                                                        <X size={18} /> Cancel
                                                    </Button>
                                                </>
                                            )}
                                            {res.status === "Confirmed" && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateStatus(res.id, "Cancelled")}
                                                    className="border-red-500/30 text-red-500/50 hover:bg-red-500/10 h-10 px-4"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            {res.status === "Cancelled" && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateStatus(res.id, "Pending")}
                                                    className="border-white/10 text-gray-500 hover:bg-white/5 h-10 px-4"
                                                >
                                                    Restore
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

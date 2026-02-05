"use client";

import { memo, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const setupLeafletIcons = () => {
    // Only run this on the client
    if (typeof window !== 'undefined') {
        const DefaultIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;
    }
};
setupLeafletIcons();

interface Order {
    id: string;
    customer_name: string;
    address: string;
    gps_location?: string;
    status: string;
}

interface OrderMapProps {
    orders: Order[];
    hotLocations?: { name: string; count: number }[];
}

// Area coordinates for hot location hotspots
const AREA_COORDINATES: Record<string, [number, number]> = {
    "Silapathar": [27.595, 94.720],
    "Sisibargaon": [27.571, 94.675],
    "Likabali": [27.650, 94.655],
    "Akajan": [27.612, 94.770],
    "Dhemaji": [27.485, 94.580],
    "Dimow": [27.447, 94.646],
    "Sadiya": [27.830, 95.670],
    "Jonai": [27.830, 95.150]
};

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center);
    return null;
}

export default function OrderMap({ orders, hotLocations = [] }: OrderMapProps) {
    const [points, setPoints] = useState<{ lat: number; lng: number; order: Order }[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const parsedPoints = orders
            .map((order) => {
                if (!order.gps_location) return null;
                const match = order.gps_location.match(/q=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/);
                if (match) {
                    return {
                        lat: parseFloat(match[1]),
                        lng: parseFloat(match[2]),
                        order,
                    };
                }
                return null;
            })
            .filter((p): p is { lat: number; lng: number; order: Order } => p !== null);

        setPoints(parsedPoints);
    }, [orders]);

    const defaultCenter: [number, number] = points.length > 0
        ? [points[0].lat, points[0].lng]
        : [27.5967, 94.7007]; // Default to Silapathar, Assam if no points

    if (!mounted) return (
        <div className="w-full h-full bg-black/20 flex items-center justify-center">
            <div className="text-gray-500 animate-pulse font-bold uppercase tracking-widest text-xs">
                Generating Map Layers...
            </div>
        </div>
    );

    return (
        <div className="w-full h-full rounded-xl overflow-hidden grayscale-[0.5] invert-[0.9] hue-rotate-[180deg] relative">
            <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Hot Location Markers (Heat Intentity Circles) */}
                {hotLocations.map((loc) => {
                    const coords = AREA_COORDINATES[loc.name] ||
                        Object.entries(AREA_COORDINATES).find(([key]) => loc.name.includes(key))?.[1];

                    if (!coords) return null;

                    const radius = Math.min(20 + loc.count * 5, 60);
                    const opacity = Math.min(0.2 + loc.count * 0.1, 0.7);

                    return (
                        <CircleMarker
                            key={`hot-${loc.name}`}
                            center={coords}
                            radius={radius}
                            pathOptions={{
                                fillColor: '#ff4400',
                                color: '#ff4400',
                                weight: 2,
                                opacity: opacity,
                                fillOpacity: opacity
                            }}
                        >
                            <Popup>
                                <div className="text-black p-2 min-w-[120px]">
                                    <h4 className="font-bold text-red-600 uppercase text-xs tracking-wider mb-1">Hot Zone</h4>
                                    <p className="font-bold text-sm">{loc.name}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">{loc.count} Active Orders</p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {/* Individual Order Markers (GPS) */}
                {points.map((point) => (
                    <Marker key={point.order.id} position={[point.lat, point.lng]}>
                        <Popup>
                            <div className="text-black">
                                <p className="font-bold">{point.order.customer_name}</p>
                                <p className="text-xs">{point.order.address}</p>
                                <p className="text-[10px] mt-1 font-bold text-red-600 uppercase">{point.order.status}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {points.length > 0 && <ChangeView center={defaultCenter} />}
            </MapContainer>

            {/* Simple Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 pointer-events-none">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.5)]" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">High Intensity Zone</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Individual Deliveries</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

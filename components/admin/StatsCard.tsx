import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
    return (
        <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-[var(--color-pizza-red)]/10 rounded-lg">
                        <Icon className="w-6 h-6 text-[var(--color-pizza-red)]" />
                    </div>
                    {trend && (
                        <span className={`text-sm font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </span>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm text-gray-400">{title}</p>
            </CardContent>
        </Card>
    );
}

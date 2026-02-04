"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
    text: string;
    className?: string;
}

export default function CopyButton({ text, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1.5 rounded-md transition-all hover:bg-white/10 active:scale-90",
                copied ? "text-green-500" : "text-gray-500 hover:text-[var(--color-pizza-red)]",
                className
            )}
            title={copied ? "Copied!" : "Copy Order ID"}
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
}

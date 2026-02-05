"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const Select = ({ children, value, onValueChange }: any) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative w-full">
            {React.Children.map(children, child => {
                if (child.type === SelectTrigger) {
                    return React.cloneElement(child, {
                        onClick: () => setIsOpen(!isOpen),
                        isOpen,
                        activeLabel: getActiveLabel(children, value)
                    });
                }
                if (child.type === SelectContent) {
                    return React.cloneElement(child, {
                        isOpen,
                        setIsOpen,
                        onValueChange,
                        activeValue: value
                    });
                }
                return child;
            })}
        </div>
    );
};

const getActiveLabel = (children: any, value: any) => {
    let label = "";
    React.Children.forEach(children, child => {
        if (child.type === SelectContent) {
            React.Children.forEach(child.props.children, item => {
                if (item?.props?.value === value) {
                    label = item.props.children;
                }
            });
        }
    });
    return label;
};

export const SelectTrigger = ({ className, activeLabel, onClick, isOpen, children }: any) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-pizza-red)]",
                className
            )}
        >
            <span className="truncate">{activeLabel || children}</span>
            <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
    );
};

export const SelectValue = ({ placeholder }: any) => {
    return <span className="text-gray-400">{placeholder}</span>;
};

export const SelectContent = ({ children, isOpen, setIsOpen, onValueChange, activeValue }: any) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Click-outside overlay */}
            <div
                className="fixed inset-0 z-[90]"
                onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 z-[100] mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-white/20 bg-black/90 backdrop-blur-xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 w-full">
                <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {React.Children.map(children, child => {
                        if (!child) return null;
                        return React.cloneElement(child, {
                            onClick: () => {
                                onValueChange(child.props.value);
                                setIsOpen(false);
                            },
                            isActive: child.props.value === activeValue
                        });
                    })}
                </div>
            </div>
        </>
    );
};

export const SelectItem = ({ children, value, onClick, isActive }: any) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-3 text-sm outline-none transition-colors hover:bg-white/10",
                isActive && "bg-[var(--color-pizza-red)]/20 text-[var(--color-pizza-red)] font-bold"
            )}
        >
            {children}
        </div>
    );
};

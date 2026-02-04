"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/orders/CartSidebar";

const Navbar = () => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Cart Hook
    const { toggleCart, items } = useCart();
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }

        if (latest > 50) {
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    });

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Menu", href: "/#menu" },
        { name: "Track Order", href: "/track-order" },
        { name: "Book Table", href: "/book-table" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <>
            <motion.nav
                variants={{
                    visible: { y: 0 },
                    hidden: { y: "-100%" },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={cn(
                    "fixed inset-x-0 top-0 z-50 transition-all duration-300",
                    scrolled
                        ? "bg-[var(--color-dark-bg)]/80 backdrop-blur-md border-b border-white/10 py-3"
                        : "bg-transparent py-5"
                )}
            >
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative w-12 h-12">
                            <Image src="/logo.png" alt="PizzaMinos Logo" fill className="object-contain" />
                        </div>
                        <span className="text-2xl font-bold font-display tracking-widest text-[var(--color-pizza-red)] hidden sm:block">
                            PIZZAMINOS
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-white/80 hover:text-[var(--color-pizza-red)] transition-colors text-sm font-medium uppercase tracking-wide"
                            >
                                {link.name}
                            </Link>
                        ))}

                        <button
                            onClick={toggleCart}
                            className="relative p-2 hover:bg-white/10 rounded-full transition-colors group"
                        >
                            <ShoppingCart className="w-6 h-6 text-white group-hover:text-[var(--color-pizza-red)] transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-pizza-red)] text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleCart}
                            className="relative p-2 text-white"
                        >
                            <ShoppingCart />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-pizza-red)] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-white p-2"
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden bg-[var(--color-dark-bg)]/95 backdrop-blur-md border-b border-white/10"
                        >
                            <div className="flex flex-col space-y-1 p-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={cn(
                                            "py-3 px-4 rounded-lg transition-all text-lg font-medium",
                                            (link as any).isButton
                                                ? "bg-[var(--color-pizza-red)] text-white text-center"
                                                : "text-white hover:text-[var(--color-pizza-red)] hover:bg-white/5"
                                        )}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* Cart Sidebar - Rendered outside of animated nav */}
            <CartSidebar />
        </>
    );
};

export default Navbar;

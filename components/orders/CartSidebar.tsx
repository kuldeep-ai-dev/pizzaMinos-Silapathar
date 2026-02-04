"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import CheckoutDialog from "./CheckoutDialog";

export default function CartSidebar() {
    const { items, updateQuantity, cartTotal, isCartOpen, toggleCart } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    return (
        <>
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleCart}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-[var(--color-dark-bg)] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <h2 className="text-[var(--color-pizza-red)] font-display text-2xl font-bold">Your Cart</h2>
                                <button onClick={toggleCart} className="text-gray-400 hover:text-white transition-colors p-2 -mr-2">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                                        <ShoppingBag size={48} className="opacity-20" />
                                        <p>Your cart is empty</p>
                                        <Button variant="link" onClick={toggleCart} className="text-[var(--color-pizza-red)]">Browse Menu</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pb-4">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm text-gray-200">{item.name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                        {item.variant && <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{item.variant}</span>}
                                                        <span className="text-[var(--color-pizza-red)]">{item.price}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="font-bold text-white">
                                                        ₹{parseInt(item.price.replace(/[^0-9]/g, "")) * item.quantity}
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/20 rounded-md p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:text-[var(--color-pizza-red)] transition-colors text-white rounded hover:bg-white/10"
                                                        >
                                                            {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                                        </button>
                                                        <span className="text-sm font-bold w-8 text-center text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:text-[var(--color-pizza-red)] transition-colors text-white rounded hover:bg-white/10"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {items.length > 0 && (
                                <div className="p-6 border-t border-white/10 space-y-4 bg-[var(--color-dark-bg)] shrink-0 pb-safe-bottom z-20">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm text-gray-400">
                                            <span>Subtotal</span>
                                            <span>₹{cartTotal}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-400">
                                            <span>Delivery Charge</span>
                                            <span>₹30</span>
                                        </div>
                                        <div className="flex justify-between items-center text-lg font-bold text-white pt-2 border-t border-white/5">
                                            <span>Total</span>
                                            <span className="text-[var(--color-pizza-red)]">₹{cartTotal + 30}</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-14 text-lg font-bold bg-[var(--color-pizza-red)] hover:bg-[var(--color-pizza-red)]/90 text-white shadow-lg active:scale-95 transition-transform"
                                        onClick={() => {
                                            toggleCart();
                                            setIsCheckoutOpen(true);
                                        }}
                                    >
                                        Proceed to Checkout
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <CheckoutDialog open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
        </>
    );
}

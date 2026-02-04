import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-black/50 border-t border-white/10 py-12">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="relative w-10 h-10">
                                <Image src="/logo.png" alt="PizzaMinos Logo" fill className="object-contain" />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-[var(--color-pizza-red)]">
                                PIZZAMINOS
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Authentic Italian Pizza & Biryani Hub in Silapather. Bringing taste to life.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="#" className="hover:text-[var(--color-pizza-red)]">Home</Link></li>
                            <li><Link href="#menu" className="hover:text-[var(--color-pizza-red)]">Menu</Link></li>
                            <li><Link href="/book-table" className="hover:text-[var(--color-pizza-red)]">Book a Table</Link></li>
                            <li><Link href="#" className="hover:text-[var(--color-pizza-red)]">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>Silapather, Assam</li>
                            <li>+91 98765 43210</li>
                            <li>hello@pizzaminos.com</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Follow Us</h4>
                        <div className="flex space-x-4">
                            <Link href="#" className="text-gray-400 hover:text-[var(--color-pizza-red)]"><Facebook size={20} /></Link>
                            <Link href="#" className="text-gray-400 hover:text-[var(--color-pizza-red)]"><Instagram size={20} /></Link>
                            <Link href="#" className="text-gray-400 hover:text-[var(--color-pizza-red)]"><Twitter size={20} /></Link>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                    <p>© {new Date().getFullYear()} PizzaMinos. All rights reserved.</p>
                    <p className="text-[var(--color-pizza-red)]/80 font-medium italic">
                        Made by <span className="text-white hover:text-[var(--color-pizza-red)] transition-colors cursor-default not-italic">MediaGeny Tech Solutions</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

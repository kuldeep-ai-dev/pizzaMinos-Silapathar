import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "PizzaMinos",
  description: "Delicious Pizza & Biryani in Silapather",
};

import { CartProvider } from "@/context/CartContext";
import SplashProvider from "@/components/layout/SplashProvider";
import Navbar from "@/components/layout/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${oswald.variable} antialiased bg-[#121212] text-white overflow-x-hidden`}
        suppressHydrationWarning
      >
        <SplashProvider>
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
        </SplashProvider>
      </body>
    </html>
  );
}

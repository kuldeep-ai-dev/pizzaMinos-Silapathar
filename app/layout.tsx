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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${oswald.variable} antialiased bg-[#121212] text-white`}
      >
        <SplashProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SplashProvider>
      </body>
    </html>
  );
}

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Menu from "@/components/sections/Menu";
import Reservation from "@/components/sections/Reservation";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-dark-bg)] text-white selection:bg-[var(--color-pizza-red)] selection:text-white overflow-x-hidden">
      <Hero />
      <Menu />
      <Reservation />
      <Footer />
    </main>
  );
}

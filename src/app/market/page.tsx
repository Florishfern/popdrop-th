import Navbar from "@/components/layout/Navbar";
import MarketClient from "./MarketClient";

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F6] text-black font-sans selection:bg-[var(--color-pop-red)] selection:text-white">
      <Navbar />
      <MarketClient />
    </main>
  );
}

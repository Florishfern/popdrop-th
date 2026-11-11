import Navbar from "@/components/layout/Navbar";
import BiddingClient from "./BiddingClient";

export default function BiddingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-[var(--color-pop-red)] selection:text-white">
      <Navbar />
      <BiddingClient />
    </main>
  );
}

import Navbar from "@/components/layout/Navbar";
import SellerDashboard from "@/components/seller/SellerDashboard";

export default function SellerPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#F8F9FA]">
      <Navbar />
      
      <div className="w-full">
        <SellerDashboard />
      </div>
    </main>
  );
}

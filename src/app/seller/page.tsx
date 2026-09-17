import Navbar from "@/components/layout/Navbar";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function SellerPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/seller");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sellerInfo: true }
  });

  if (!user) {
    redirect("/login?callbackUrl=/seller");
  }

  const isPhoneVerified = !!user.phoneVerified;
  const isKycVerified = !!user.sellerInfo?.isVerifiedDocument || user.sellerInfo?.idCardStatus === "APPROVED";

  if (!isPhoneVerified || !isKycVerified) {
    // Redirect them to profile so they can verify phone/document
    redirect("/profile");
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#F8F9FA]">
      <Navbar />
      
      <div className="w-full">
        <SellerDashboard />
      </div>
    </main>
  );
}

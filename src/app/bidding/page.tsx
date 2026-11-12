import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import BiddingClient from "./BiddingClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BiddingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab;
  const callbackUrl = tab ? `/bidding?tab=${tab}` : "/bidding";

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-[var(--color-pop-red)] selection:text-white">
      <Navbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20 text-sm text-neutral-400 font-medium">กำลังโหลด...</div>}>
        <BiddingClient />
      </Suspense>
    </main>
  );
}

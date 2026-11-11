import { NextResponse } from "next/server";
import { processEndedAuctions } from "@/lib/auctionService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await processEndedAuctions();
    return NextResponse.json({ success: true, message: "Auctions processed successfully" });
  } catch (error) {
    console.error("Cron Auctions Error:", error);
    return NextResponse.json({ error: "Failed to process auctions" }, { status: 500 });
  }
}

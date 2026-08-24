import { NextResponse } from "next/server";

// Mock database in memory
let mockBids = [
  { id: '1', productId: '1', username: 'user_123', bidAmount: 5300, timestamp: new Date(Date.now() - 50000).toISOString() },
  { id: '2', productId: '1', username: 'crypto_king', bidAmount: 5400, timestamp: new Date().toISOString() },
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const bids = mockBids.filter(b => b.productId === productId);
  return NextResponse.json(bids);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const body = await req.json();

  const newBid = {
    id: Math.random().toString(36).substr(2, 9),
    productId,
    username: body.userId || "anonymous",
    bidAmount: body.bidAmount,
    timestamp: new Date().toISOString(),
  };

  mockBids = [newBid, ...mockBids];

  return NextResponse.json({ success: true, message: "Bid placed successfully!" });
}

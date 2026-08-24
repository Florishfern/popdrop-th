import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { carrier, trackingNumber } = body;

  if (!carrier || !trackingNumber) {
    return NextResponse.json(
      { error: "Carrier and tracking number are required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Tracking for order ${id} updated to ${carrier} (${trackingNumber})`,
    orderId: id,
    carrier,
    trackingNumber,
  });
}

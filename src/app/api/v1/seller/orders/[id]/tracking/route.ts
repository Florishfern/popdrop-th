import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { carrier, trackingNumber } = body;

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: "Carrier and tracking number are required" },
        { status: 400 }
      );
    }

    // Ensure the transaction belongs to the logged-in seller
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        sellerId: session.user.id,
      },
      include: {
        product: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the transaction
    await prisma.transaction.update({
      where: { id },
      data: {
        carrier,
        trackingNumber,
        status: "SHIPPED",
      },
    });

    // Notify Buyer
    await createNotification({
      userId: transaction.buyerId,
      title: "สินค้ากำลังจัดส่ง",
      message: `สินค้า "${transaction.product.title}" ของคุณกำลังถูกจัดส่งโดย ${carrier} หมายเลขพัสดุ: ${trackingNumber}`,
      type: "INFO",
      link: "/profile",
    });

    return NextResponse.json({
      success: true,
      message: `Tracking for order ${id} updated to ${carrier} (${trackingNumber})`,
      orderId: id,
      carrier,
      trackingNumber,
      status: "In Progress", // return mapped status to client
    });
  } catch (error) {
    console.error("Update Tracking Error:", error);
    return NextResponse.json(
      { error: "Failed to update tracking information" },
      { status: 500 }
    );
  }
}

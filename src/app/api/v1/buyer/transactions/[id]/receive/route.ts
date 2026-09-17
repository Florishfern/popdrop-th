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

    // Ensure the transaction belongs to the logged-in buyer
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        buyerId: session.user.id,
      },
      include: {
        product: true,
        seller: true,
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the transaction status to DELIVERED
    await prisma.transaction.update({
      where: { id },
      data: {
        status: "DELIVERED",
      },
    });

    // --- NOTIFICATIONS & BADGE LOGIC ---

    // 1. Notify Seller that buyer received the item
    await createNotification({
      userId: transaction.sellerId,
      title: "จัดส่งสินค้าสำเร็จ",
      message: `ผู้ซื้อได้รับสินค้า "${transaction.product.title}" แล้ว (Order ID: ${transaction.id})`,
      type: "SUCCESS",
      link: "/seller",
    });

    // 2. Check if Seller has unlocked Top Seller Badge (e.g. 100 sales)
    const sellerInfo = await prisma.sellerInfo.findUnique({
      where: { userId: transaction.sellerId }
    });

    if (sellerInfo && !sellerInfo.hasTopSellerBadge) {
      const deliveredCount = await prisma.transaction.count({
        where: {
          sellerId: transaction.sellerId,
          status: "DELIVERED"
        }
      });

      if (deliveredCount >= 100) { // Condition to unlock badge
        await prisma.sellerInfo.update({
          where: { userId: transaction.sellerId },
          data: { hasTopSellerBadge: true }
        });

        // Notify Seller about Badge
        await createNotification({
          userId: transaction.sellerId,
          title: "ยินดีด้วย!",
          message: "คุณทำการขายสำเร็จครบ 100 รายการ และได้รับ Seller Badge แล้ว!",
          type: "INFO",
          link: "/seller/profile",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${id} marked as received`,
      orderId: id,
      status: "Completed", // mapped status
    });
  } catch (error) {
    console.error("Confirm Receipt Error:", error);
    return NextResponse.json(
      { error: "Failed to confirm receipt" },
      { status: 500 }
    );
  }
}

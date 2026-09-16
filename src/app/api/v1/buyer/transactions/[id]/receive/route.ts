import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the transaction status to DELIVERED
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: "DELIVERED",
      },
    });

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

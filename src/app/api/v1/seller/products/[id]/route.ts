import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.sellerId !== session.user.id) {
      return NextResponse.json({ message: "Product not found or unauthorized" }, { status: 404 });
    }

    const now = new Date();
    // Only allow deletion if the auction hasn't started
    if (now >= product.startTime) {
      return NextResponse.json(
        { message: "Cannot delete product after auction has started" },
        { status: 400 }
      );
    }

    // Delete product (this cascades to images, bids if any, etc if configured in schema)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 }
    );
  }
}

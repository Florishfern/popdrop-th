import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const bids = await prisma.bid.findMany({
      where: { productId },
      include: {
        bidder: { select: { name: true, image: true, id: true } },
      },
      orderBy: { amount: "desc" },
    });

    const formattedBids = bids.map((b) => ({
      id: b.id,
      productId: b.productId,
      username: b.bidder.name || "User",
      bidAmount: b.amount,
      timestamp: b.createdAt.toISOString(),
      avatar: b.bidder.image,
    }));

    return NextResponse.json(formattedBids);
  } catch (error) {
    console.error("Get Bids Error:", error);
    return NextResponse.json({ message: "Failed to fetch bids" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const body = await req.json();
    const { bidAmount } = body;

    if (!bidAmount || isNaN(bidAmount)) {
      return NextResponse.json({ message: "Invalid bid amount" }, { status: 400 });
    }

    // Verify Buyer Prerequisites
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { creditCards: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const missingRequirements = [];
    if (!user.phoneVerified) {
      missingRequirements.push("phone_verified");
    }
    if (user.creditCards.length === 0) {
      missingRequirements.push("credit_card");
    }

    if (missingRequirements.length > 0) {
      return NextResponse.json(
        { 
          error: "Prerequisites missing", 
          missingRequirements 
        },
        { status: 403 }
      );
    }

    // Run within a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { images: { take: 1 } },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.status !== "LIVE") {
        throw new Error("Bidding is not active for this product");
      }

      if (bidAmount <= product.currentPrice) {
        throw new Error("Bid must be higher than current price");
      }

      // Find the previous highest bidder to notify them
      const previousHighestBid = await tx.bid.findFirst({
        where: { productId },
        orderBy: { amount: "desc" },
      });

      // Update product current price
      await tx.product.update({
        where: { id: productId },
        data: { currentPrice: bidAmount },
      });

      // Create new bid
      const newBid = await tx.bid.create({
        data: {
          productId,
          bidderId: session.user.id,
          amount: bidAmount,
        },
      });

      return { product, previousHighestBid, newBid };
    });

    // Send Outbid Notification OUTSIDE the transaction
    if (result.previousHighestBid && result.previousHighestBid.bidderId !== session.user.id) {
      await createNotification({
        userId: result.previousHighestBid.bidderId,
        title: "มีผู้เสนอราคาสูงกว่าคุณ",
        message: `มีผู้เสนอราคาสูงกว่าคุณสำหรับสินค้า "${result.product.title}" เสนอราคาใหม่เพื่อเป็นผู้ชนะ!`,
        type: "OUTBID",
        link: `/market/${productId}`,
        imageUrl: result.product.images[0]?.imageUrl,
      });
    }

    return NextResponse.json({ success: true, message: "Bid placed successfully!" });
  } catch (error: any) {
    console.error("Place Bid Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to place bid" },
      { status: error.message === "Product not found" ? 404 : 400 }
    );
  }
}

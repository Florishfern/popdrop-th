import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export const dynamic = "force-dynamic";

function formatProductItem(
  p: any,
  extra?: {
    isNotified?: boolean;
    myHighestBid?: number | null;
    isLeading?: boolean;
    transactionStatus?: string | null;
    wonAmount?: number | null;
  }
) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    currentBid: p.currentPrice,
    price: p.startPrice,
    minBidStep: Math.round(p.startPrice * 0.05),
    startTime: p.startTime.toISOString(),
    endTime: p.endTime.toISOString(),
    status: p.status,
    isAuction: true,
    isNotified: extra?.isNotified ?? false,
    myHighestBid: extra?.myHighestBid ?? null,
    isLeading: extra?.isLeading ?? false,
    transactionStatus: extra?.transactionStatus ?? null,
    wonAmount: extra?.wonAmount ?? null,
    imageUrl:
      p.images && p.images.length > 0
        ? p.images[0].imageUrl
        : "https://via.placeholder.com/300",
    category: p.category || "Art Toy",
    seller: {
      id: p.seller?.id || "unknown",
      name: p.seller?.name || "Unknown Seller",
      avatar:
        p.seller?.image || "https://api.dicebear.com/7.x/bottts/svg?seed=seller",
      totalSalesCount: 0,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({
        authenticated: false,
        upcoming: [],
        live: [],
        won: [],
      });
    }

    const userId = session.user.id;
    const now = new Date();

    // Auto-finalize any LIVE auctions whose endTime has already passed
    try {
      const endedAuctions = await prisma.product.findMany({
        where: {
          status: "LIVE",
          endTime: { lte: now },
        },
        include: {
          images: { take: 1 },
        },
      });

      for (const product of endedAuctions) {
        const winningBid = await prisma.bid.findFirst({
          where: { productId: product.id },
          orderBy: { amount: "desc" },
        });

        if (winningBid) {
          await prisma.product.update({
            where: { id: product.id },
            data: { status: "SOLD" },
          });

          const existingTx = await prisma.transaction.findUnique({
            where: { productId: product.id },
          });

          if (!existingTx) {
            await prisma.transaction.create({
              data: {
                productId: product.id,
                buyerId: winningBid.bidderId,
                sellerId: product.sellerId,
                amount: winningBid.amount,
                status: "PAID",
              },
            });

            await createNotification({
              userId: winningBid.bidderId,
              title: "คุณชนะการประมูล!",
              message: `ยินดีด้วย! คุณชนะการประมูลสินค้า "${product.title}" ในราคา ฿${winningBid.amount.toLocaleString()}`,
              type: "WON",
              link: `/bidding`,
              imageUrl: product.images[0]?.imageUrl,
            });
          }
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: { status: "ENDED" },
          });
        }
      }
    } catch (finalizeErr) {
      console.error("Auto-finalize auctions warning:", finalizeErr);
    }

    const [reminders, userBids, wonTransactions] = await Promise.all([
      prisma.productReminder.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              seller: { select: { id: true, name: true, image: true } },
              bids: { orderBy: { amount: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bid.findMany({
        where: { bidderId: userId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              seller: { select: { id: true, name: true, image: true } },
              bids: { orderBy: { amount: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { amount: "desc" },
      }),
      prisma.transaction.findMany({
        where: { buyerId: userId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              seller: { select: { id: true, name: true, image: true } },
              bids: { orderBy: { amount: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Map highest bid per product for this user
    const myHighestBidByProduct = new Map<string, number>();
    for (const b of userBids) {
      const current = myHighestBidByProduct.get(b.productId) || 0;
      if (b.amount > current) {
        myHighestBidByProduct.set(b.productId, b.amount);
      }
    }

    const remindedProductIds = new Set(reminders.map((r) => r.productId));

    // 1. UPCOMING: Reminded products where startTime > now and auction hasn't ended
    const upcomingMap = new Map<string, any>();
    for (const r of reminders) {
      const p = r.product;
      if (!p) continue;
      const startTime = new Date(p.startTime);
      const endTime = new Date(p.endTime);
      if (
        now < startTime &&
        now < endTime &&
        p.status !== "SOLD" &&
        p.status !== "ENDED" &&
        p.status !== "DRAFT"
      ) {
        upcomingMap.set(
          p.id,
          formatProductItem(p, {
            isNotified: true,
          })
        );
      }
    }

    // 2. LIVE:
    // - Reminded products whose startTime has arrived (now >= startTime && now < endTime && status === 'LIVE')
    // - OR products where the user has placed a bid that are currently LIVE (now >= startTime && now < endTime && status === 'LIVE')
    const liveMap = new Map<string, any>();

    for (const r of reminders) {
      const p = r.product;
      if (!p) continue;
      const startTime = new Date(p.startTime);
      const endTime = new Date(p.endTime);
      if (now >= startTime && now < endTime && p.status === "LIVE") {
        const myBid = myHighestBidByProduct.get(p.id) ?? null;
        const topBid = p.bids?.[0];
        liveMap.set(
          p.id,
          formatProductItem(p, {
            isNotified: true,
            myHighestBid: myBid,
            isLeading: !!topBid && topBid.bidderId === userId,
          })
        );
      }
    }

    for (const b of userBids) {
      const p = b.product;
      if (!p || liveMap.has(p.id)) continue;
      const startTime = new Date(p.startTime);
      const endTime = new Date(p.endTime);
      if (now >= startTime && now < endTime && p.status === "LIVE") {
        const myBid = myHighestBidByProduct.get(p.id) ?? null;
        const topBid = p.bids?.[0];
        liveMap.set(
          p.id,
          formatProductItem(p, {
            isNotified: remindedProductIds.has(p.id),
            myHighestBid: myBid,
            isLeading: !!topBid && topBid.bidderId === userId,
          })
        );
      }
    }

    // 3. WON (Last Tab):
    // - Products won by the user (either in Transaction table or ended auctions where user has highest bid)
    const wonMap = new Map<string, any>();

    for (const tx of wonTransactions) {
      const p = tx.product;
      if (!p) continue;
      wonMap.set(
        p.id,
        formatProductItem(p, {
          isNotified: remindedProductIds.has(p.id),
          myHighestBid: myHighestBidByProduct.get(p.id) ?? tx.amount,
          isLeading: true,
          transactionStatus: tx.status,
          wonAmount: tx.amount,
        })
      );
    }

    for (const b of userBids) {
      const p = b.product;
      if (!p || wonMap.has(p.id)) continue;
      const endTime = new Date(p.endTime);
      const topBid = p.bids?.[0];
      if (
        (now >= endTime || p.status === "SOLD") &&
        topBid &&
        topBid.bidderId === userId
      ) {
        wonMap.set(
          p.id,
          formatProductItem(p, {
            isNotified: remindedProductIds.has(p.id),
            myHighestBid: topBid.amount,
            isLeading: true,
            transactionStatus: "PAID",
            wonAmount: topBid.amount,
          })
        );
      }
    }

    return NextResponse.json({
      authenticated: true,
      upcoming: Array.from(upcomingMap.values()),
      live: Array.from(liveMap.values()),
      won: Array.from(wonMap.values()),
    });
  } catch (error) {
    console.error("Failed to fetch bidding items:", error);
    return NextResponse.json(
      { error: "Failed to fetch bidding items" },
      { status: 500 }
    );
  }
}

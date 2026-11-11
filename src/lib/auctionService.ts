import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export async function processEndedAuctions() {
  try {
    const now = new Date();

    // 1. Process LIVE auctions whose endTime has passed
    const liveEndedProducts = await prisma.product.findMany({
      where: {
        status: "LIVE",
        endTime: { lte: now },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });

    for (const product of liveEndedProducts) {
      const winningBid = await prisma.bid.findFirst({
        where: { productId: product.id },
        orderBy: { amount: "desc" },
      });

      if (winningBid) {
        // Mark product as SOLD
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "SOLD" },
        });

        // Create transaction if not existing
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
        }

        const imageUrl = product.images[0]?.imageUrl;

        // 1. Notify Buyer (Won)
        await createNotification({
          userId: winningBid.bidderId,
          title: "คุณชนะการประมูล!",
          message: `ยินดีด้วย! คุณชนะการประมูลสินค้า "${product.title}" ในราคา ฿${winningBid.amount.toLocaleString()}`,
          type: "WON",
          link: "/bidding",
          imageUrl,
        });

        // 2. Notify Seller (Sold)
        await createNotification({
          userId: product.sellerId,
          title: "การประมูลสิ้นสุดลง - สินค้าของคุณถูกขายแล้ว!",
          message: `ยินดีด้วย! สินค้า "${product.title}" มีผู้ชนะการประมูลในราคา ฿${winningBid.amount.toLocaleString()}`,
          type: "SOLD",
          link: "/seller/orders",
          imageUrl,
        });

        // 3. Notify all other bidders that auction ended
        const otherBids = await prisma.bid.findMany({
          where: {
            productId: product.id,
            bidderId: { not: winningBid.bidderId },
          },
          select: { bidderId: true },
          distinct: ["bidderId"],
        });

        for (const other of otherBids) {
          await createNotification({
            userId: other.bidderId,
            title: "การประมูลสิ้นสุดลงแล้ว",
            message: `การประมูลสำหรับสินค้า "${product.title}" สิ้นสุดลงแล้ว`,
            type: "INFO",
            link: `/market`,
            imageUrl,
          });
        }
      } else {
        // No bids placed -> Mark as ENDED
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "ENDED" },
        });

        const imageUrl = product.images[0]?.imageUrl;

        // Notify Seller
        await createNotification({
          userId: product.sellerId,
          title: "การประมูลสิ้นสุดลง (ไม่มีผู้เสนอราคา)",
          message: `การประมูลสำหรับสินค้า "${product.title}" สิ้นสุดลงแล้วโดยไม่มีผู้เสนอราคา`,
          type: "INFO",
          link: "/seller/products",
          imageUrl,
        });

        // Notify users who requested reminder
        const reminders = await prisma.productReminder.findMany({
          where: { productId: product.id },
          select: { userId: true },
        });

        for (const rem of reminders) {
          await createNotification({
            userId: rem.userId,
            title: "การประมูลสิ้นสุดลงแล้ว",
            message: `การประมูลสำหรับสินค้า "${product.title}" ที่คุณติดตามสิ้นสุดลงแล้ว`,
            type: "INFO",
            link: "/market",
            imageUrl,
          });
        }
      }
    }

    // 2. Catch-up check: Check recent ENDED products that may not have notified the seller yet
    const recentEndedProducts = await prisma.product.findMany({
      where: {
        status: "ENDED",
        endTime: {
          lte: now,
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24h
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 20,
    });

    for (const prod of recentEndedProducts) {
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: prod.sellerId,
          title: { contains: "การประมูลสิ้นสุดลง" },
          message: { contains: prod.title },
        },
      });

      if (!existingNotif) {
        await createNotification({
          userId: prod.sellerId,
          title: "การประมูลสิ้นสุดลง (ไม่มีผู้เสนอราคา)",
          message: `การประมูลสำหรับสินค้า "${prod.title}" สิ้นสุดลงแล้วโดยไม่มีผู้เสนอราคา`,
          type: "INFO",
          link: "/seller/products",
          imageUrl: prod.images[0]?.imageUrl,
        });
      }
    }
  } catch (error) {
    console.error("processEndedAuctions error:", error);
  }
}

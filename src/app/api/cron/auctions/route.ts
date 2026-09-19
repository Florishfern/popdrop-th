import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    // Find all LIVE products where endTime has passed
    const endedAuctions = await prisma.product.findMany({
      where: {
        status: "LIVE",
        endTime: {
          lte: now,
        },
      },
      include: {
        images: { take: 1 },
      }
    });

    for (const product of endedAuctions) {
      // Find the highest bid
      const winningBid = await prisma.bid.findFirst({
        where: { productId: product.id },
        orderBy: { amount: "desc" },
      });

      if (winningBid) {
        // Update product status to SOLD
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "SOLD" },
        });

        // 1. Notify Winning Buyer
        await createNotification({
          userId: winningBid.bidderId,
          title: "คุณชนะการประมูล!",
          message: `ยินดีด้วย! คุณชนะการประมูลสินค้า "${product.title}" ในราคา ฿${winningBid.amount.toLocaleString()}`,
          type: "WON",
          link: `/market/${product.id}`,
          imageUrl: product.images[0]?.imageUrl,
        });

        // 2. Notify Seller that item was sold
        await createNotification({
          userId: product.sellerId,
          title: "รายการสินค้าของคุณถูกขายแล้ว",
          message: `สินค้า "${product.title}" ถูกขายให้กับผู้ชนะการประมูลในราคา ฿${winningBid.amount.toLocaleString()}`,
          type: "SOLD",
          link: `/seller/orders`,
          imageUrl: product.images[0]?.imageUrl,
        });

        // Create a Transaction for the winning bid to process payment later
        // Check if transaction already exists just in case
        const existingTx = await prisma.transaction.findUnique({
          where: { productId: product.id }
        });

        if (!existingTx) {
          await prisma.transaction.create({
            data: {
              productId: product.id,
              buyerId: winningBid.bidderId,
              sellerId: product.sellerId,
              amount: winningBid.amount,
              status: "PAID", // Auto-charged the linked credit card
            }
          });

          // 3. Notify Buyer: Payment successful
          await createNotification({
            userId: winningBid.bidderId,
            title: "ชำระเงินสำเร็จ",
            message: `ระบบได้ทำการตัดบัตรเครดิตของคุณสำหรับสินค้า "${product.title}" เรียบร้อยแล้ว`,
            type: "SUCCESS",
            link: `/profile`,
            imageUrl: product.images[0]?.imageUrl,
          });

          // 4. Notify Seller: Payment received, prepare to ship
          await createNotification({
            userId: product.sellerId,
            title: "ผู้ซื้อชำระเงินสำเร็จแล้ว",
            message: `ผู้ซื้อได้ชำระเงินสำหรับ "${product.title}" เรียบร้อยแล้ว กรุณาเตรียมการจัดส่ง`,
            type: "SUCCESS",
            link: `/seller/orders`,
            imageUrl: product.images[0]?.imageUrl,
          });
        }
      } else {
        // No bids, auction ended without winner
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "ENDED" },
        });

        // Notify Seller
        await createNotification({
          userId: product.sellerId,
          title: "การประมูลสิ้นสุดลง (ไม่มีผู้เสนอราคา)",
          message: `การประมูลสำหรับสินค้า "${product.title}" สิ้นสุดลงโดยไม่มีผู้เสนอราคา`,
          type: "INFO",
          link: `/seller/products`,
          imageUrl: product.images[0]?.imageUrl,
        });
      }
    }

    return NextResponse.json({ success: true, message: `Processed ${endedAuctions.length} ended auctions` });
  } catch (error) {
    console.error("Cron Auctions Error:", error);
    return NextResponse.json({ error: "Failed to process auctions" }, { status: 500 });
  }
}

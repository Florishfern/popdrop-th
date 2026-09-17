import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Find all products that start in the next 15 minutes, and haven't started yet
    const now = new Date();
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60000);

    const upcomingProducts = await prisma.product.findMany({
      where: {
        status: "DRAFT", // assuming DRAFT means not live yet, or whatever status implies scheduled
        startTime: {
          gt: now,
          lte: fifteenMinsFromNow,
        },
      },
      include: {
        images: { take: 1 },
      }
    });

    for (const product of upcomingProducts) {
      // Find all users who asked for a reminder and haven't been sent one yet
      const reminders = await prisma.productReminder.findMany({
        where: {
          productId: product.id,
          isSent: false,
        },
      });

      for (const reminder of reminders) {
        // Send notification
        await createNotification({
          userId: reminder.userId,
          title: "สินค้าที่คุณสนใจกำลังจะเริ่มประมูล!",
          message: `การประมูลสำหรับสินค้า "${product.title}" กำลังจะเริ่มในอีกไม่ถึง 15 นาที!`,
          type: "INFO",
          link: `/market/${product.id}`,
          imageUrl: product.images[0]?.imageUrl,
        });

        // Mark reminder as sent
        await prisma.productReminder.update({
          where: { id: reminder.id },
          data: { isSent: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: `Processed ${upcomingProducts.length} products` });
  } catch (error) {
    console.error("Cron Reminders Error:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}

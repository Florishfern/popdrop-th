import prisma from "@/lib/prisma";

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
  imageUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type: "LIVE" | "BID" | "WON" | "INFO" | "SUCCESS" | "OUTBID" | "SOLD";
  link?: string;
  imageUrl?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        imageUrl,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw, just log to prevent breaking the main transaction flow
    return null;
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { documentUrl } = await req.json();
    if (!documentUrl) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 });
    }

    // Upsert SellerInfo and auto-approve for demo purposes
    await prisma.sellerInfo.upsert({
      where: { userId: session.user.id },
      update: {
        isVerifiedDocument: true,
        idCardImageUrl: documentUrl,
        idCardStatus: "APPROVED",
      },
      create: {
        userId: session.user.id,
        isVerifiedDocument: true,
        idCardImageUrl: documentUrl,
        idCardStatus: "APPROVED",
      },
    });

    // Send Notification
    await createNotification({
      userId: session.user.id,
      title: "ยืนยันตัวตนสำเร็จ",
      message: "เอกสารยืนยันตัวตนของคุณได้รับการอนุมัติเรียบร้อยแล้ว",
      type: "SUCCESS",
      link: "/seller/profile",
    });

    return NextResponse.json({
      success: true,
      message: "Identity document verified",
      status: "Approved",
    });
  } catch (error) {
    console.error("KYC Error:", error);
    return NextResponse.json({ error: "Failed to verify identity" }, { status: 500 });
  }
}

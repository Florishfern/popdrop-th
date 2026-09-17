import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify Phone
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: new Date(), phone: "0812345678" }
    });

    // Add Credit Card
    const existingCards = await prisma.creditCard.findMany({ where: { userId } });
    if (existingCards.length === 0) {
      await prisma.creditCard.create({
        data: {
          userId,
          cardholderName: "Test User",
          lastFourDigits: "4242",
          expiry: "12/28",
          brand: "Visa",
          token: "tok_visa",
          isDefault: true,
        }
      });
    }

    // Verify KYC & Bank Account
    await prisma.sellerInfo.upsert({
      where: { userId },
      update: {
        isVerifiedDocument: true,
        idCardStatus: "APPROVED",
        bankName: "KBANK",
        bankAccountNo: "1234567890",
      },
      create: {
        userId,
        isVerifiedDocument: true,
        idCardStatus: "APPROVED",
        bankName: "KBANK",
        bankAccountNo: "1234567890",
      }
    });

    return NextResponse.json({ success: true, message: "Mock verification completed successfully" });
  } catch (error) {
    console.error("Mock Verify Error:", error);
    return NextResponse.json({ message: "Failed to run mock verification" }, { status: 500 });
  }
}

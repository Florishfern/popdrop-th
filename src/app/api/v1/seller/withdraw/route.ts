import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { amount } = body;

    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount < 500) {
      return NextResponse.json({ error: "จำนวนเงินถอนขั้นต่ำคือ 500 บาท" }, { status: 400 });
    }

    // 1. Calculate Total Balance to ensure they have enough
    const deliveredTransactions = await prisma.transaction.aggregate({
      where: {
        sellerId: userId,
        status: "DELIVERED",
      },
      _sum: {
        amount: true,
      },
    });
    
    const grossDelivered = deliveredTransactions._sum.amount || 0;
    const netDelivered = grossDelivered * 0.95; // 5% commission

    const existingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        sellerId: userId,
        status: { in: ["PENDING", "COMPLETED"] },
      },
      _sum: {
        amount: true,
      },
    });

    const totalWithdrawn = existingWithdrawals._sum.amount || 0;
    const currentBalance = Math.max(0, netDelivered - totalWithdrawn);

    if (withdrawalAmount > currentBalance) {
      return NextResponse.json({ error: "ยอดเงินไม่เพียงพอ" }, { status: 400 });
    }

    // 2. Create the withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        sellerId: userId,
        amount: withdrawalAmount,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "ส่งคำขอถอนเงินสำเร็จ",
      withdrawal,
    });

  } catch (error) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json(
      { error: "ระบบขัดข้อง ไม่สามารถทำรายการได้ในขณะนี้" },
      { status: 500 }
    );
  }
}

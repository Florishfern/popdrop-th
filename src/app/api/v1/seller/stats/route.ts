import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const timeframe = url.searchParams.get("timeframe") || "Month"; // Day, Month, Year

    // 1. Calculate Total Balance (Lifetime)
    // Formula: (Sum of Transaction amount where status = "DELIVERED") * 0.95 - (Sum of Withdrawal amount)
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
    const netDelivered = grossDelivered * 0.95; // Deduct 5% commission

    const withdrawals = await prisma.withdrawal.aggregate({
      where: {
        sellerId: userId,
        status: { in: ["PENDING", "COMPLETED"] },
      },
      _sum: {
        amount: true,
      },
    });

    const totalWithdrawn = withdrawals._sum.amount || 0;
    const totalBalance = Math.max(0, netDelivered - totalWithdrawn);

    // 2. Determine date filter for Total Income and Category Income
    const now = new Date();
    let startDate = new Date(0); // Default to beginning of time if timeframe is invalid

    if (timeframe === "Day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === "Month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === "Year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // 3. Calculate Gross Income for the selected timeframe
    // Count any transaction that has been paid (PAID, SHIPPED, DELIVERED)
    const validStatuses = ["PAID", "SHIPPED", "DELIVERED"];

    // Total Income (Gross)
    const timeframeTransactions = await prisma.transaction.aggregate({
      where: {
        sellerId: userId,
        status: { in: validStatuses },
        createdAt: { gte: startDate },
      },
      _sum: {
        amount: true,
      },
    });
    const totalIncome = timeframeTransactions._sum.amount || 0;

    // Category Income
    // We need to join with Product to get the category
    const transactionsWithProduct = await prisma.transaction.findMany({
      where: {
        sellerId: userId,
        status: { in: validStatuses },
        createdAt: { gte: startDate },
      },
      include: {
        product: {
          select: { category: true }
        }
      }
    });

    let tradingCardSales = 0;
    let artToySales = 0;
    let modelSales = 0;

    for (const t of transactionsWithProduct) {
      const category = t.product.category?.toLowerCase() || "";
      if (category.includes("card") || category.includes("pokemon") || category.includes("lorcana")) {
        tradingCardSales += t.amount;
      } else if (category.includes("art toy") || category.includes("toy") || category.includes("blind box")) {
        artToySales += t.amount;
      } else {
        // Assume anything else falls into Model or others for now
        modelSales += t.amount;
      }
    }

    return NextResponse.json({
      totalBalance,
      totalIncome,
      tradingCardSales,
      artToySales,
      modelSales,
      currency: "THB",
    });

  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json(
      { message: "Failed to load stats" },
      { status: 500 }
    );
  }
}

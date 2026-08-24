import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    totalBalance: 689372.0,
    totalIncome: 1050000,
    tradingCardSales: 700000,
    artToySales: 950000,
    modelSales: 850000,
    currency: "THB",
  });
}

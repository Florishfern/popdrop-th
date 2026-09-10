import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cards = await prisma.creditCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" }
    });

    const formattedCards = cards.map(c => ({
      id: c.id,
      cardNumberMasked: `•••• •••• •••• ${c.lastFourDigits}`,
      last4: c.lastFourDigits,
      expiry: c.expiry,
      cardholderName: c.cardholderName,
      brand: c.brand,
      isDefault: c.isDefault,
      token: c.token,
    }));

    return NextResponse.json(formattedCards);
  } catch (error) {
    console.error("Error fetching credit cards:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    const cleanNum = body.cardNumber.replace(/\s+/g, "");
    const lastFourDigits = cleanNum.slice(-4) || "4242";
    const brand = cleanNum.startsWith("5") ? "Mastercard" : "Visa";
    const token = `tok_${Math.random().toString(36).substring(2, 10)}`;

    const existingCount = await prisma.creditCard.count({
      where: { userId: session.user.id }
    });
    
    const isDefault = existingCount === 0;

    const newCard = await prisma.creditCard.create({
      data: {
        userId: session.user.id,
        cardholderName: body.cardholderName.toUpperCase(),
        lastFourDigits,
        expiry: body.expiry,
        brand,
        token,
        isDefault,
      }
    });

    const formattedCard = {
      id: newCard.id,
      cardNumberMasked: `•••• •••• •••• ${newCard.lastFourDigits}`,
      last4: newCard.lastFourDigits,
      expiry: newCard.expiry,
      cardholderName: newCard.cardholderName,
      brand: newCard.brand,
      isDefault: newCard.isDefault,
      token: newCard.token,
    };

    return NextResponse.json(formattedCard, { status: 201 });
  } catch (error) {
    console.error("Error creating credit card:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

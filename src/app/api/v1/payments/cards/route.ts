import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { cardNumber, cardholderName, expiry } = await req.json();
    if (!cardNumber || !cardholderName || !expiry) {
      return NextResponse.json({ error: "Missing required card details" }, { status: 400 });
    }

    const cleanNum = cardNumber.replace(/\s+/g, "");
    const last4 = cleanNum.slice(-4) || "4242";
    const brand = cleanNum.startsWith("5") ? "Mastercard" : "Visa";
    const token = `tok_${Math.random().toString(36).substring(2, 10)}`;

    return NextResponse.json({
      id: `card_${Date.now()}`,
      cardNumberMasked: `•••• •••• •••• ${last4}`,
      last4,
      expiry,
      cardholderName: cardholderName.toUpperCase(),
      brand,
      isDefault: false,
      token,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

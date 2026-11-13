import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sellerInfo = await prisma.sellerInfo.findUnique({
      where: { userId: session.user.id },
      select: {
        bankName: true,
        bankAccountNo: true,
      },
    });

    return NextResponse.json({
      bankName: sellerInfo?.bankName || null,
      bankAccountNo: sellerInfo?.bankAccountNo || null,
      isConnected: !!sellerInfo?.bankAccountNo,
    });
  } catch (error) {
    console.error("GET Seller Bank Error:", error);
    return NextResponse.json({ error: "Failed to fetch bank account" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankName, bankAccountNo } = body;

    const trimmedBankName = (bankName || "").trim();
    const trimmedAccountNo = (bankAccountNo || "").trim();

    if (!trimmedBankName || !trimmedAccountNo) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อธนาคารและเลขบัญชีให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (trimmedAccountNo.replace(/\D/g, "").length < 8) {
      return NextResponse.json(
        { error: "เลขบัญชีธนาคารไม่ถูกต้อง (ต้องมีความยาวอย่างน้อย 8-10 หลัก)" },
        { status: 400 }
      );
    }

    const updated = await prisma.sellerInfo.upsert({
      where: { userId: session.user.id },
      update: {
        bankName: trimmedBankName,
        bankAccountNo: trimmedAccountNo,
      },
      create: {
        userId: session.user.id,
        bankName: trimmedBankName,
        bankAccountNo: trimmedAccountNo,
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกบัญชีธนาคารเรียบร้อยแล้ว",
      bankName: updated.bankName,
      bankAccountNo: updated.bankAccountNo,
    });
  } catch (error) {
    console.error("POST Seller Bank Error:", error);
    return NextResponse.json({ error: "Failed to save bank account" }, { status: 500 });
  }
}

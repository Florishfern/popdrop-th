import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Initialize APIs
const snsClient = new SNSClient({ region: process.env.AWS_REGION || "ap-southeast-1" });

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
}

// REQUEST OTP
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type, destination } = await req.json(); // type: "EMAIL" | "PHONE"

    if (!type || !destination) {
      return NextResponse.json({ message: "Type and destination are required" }, { status: 400 });
    }

    const code = "123456"; // MOCK MODE: Always use 123456
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB (Invalidate previous unverified OTPs for this user/type)
    await prisma.otpCode.updateMany({
      where: { userId: session.user.id, type, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.otpCode.create({
      data: {
        userId: session.user.id,
        code,
        type,
        expiresAt,
      }
    });

    // Mock sending
    console.log(`[MOCK MODE] OTP sent to ${destination}: ${code}`);

    // In dev mode or without real creds, return the code for testing
    // (In real prod with real SMS/Email, we wouldn't return this to client)
    return NextResponse.json({ 
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// VERIFY OTP
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type, code } = await req.json();

    if (!type || !code) {
      return NextResponse.json({ message: "Type and code are required" }, { status: 400 });
    }

    // Find the latest valid OTP
    const validOtp = await prisma.otpCode.findFirst({
      where: {
        userId: session.user.id,
        type,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validOtp) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: validOtp.id },
      data: { isUsed: true },
    });

    // Update user verification status
    const updateData: any = {};
    if (type === "EMAIL") updateData.emailVerified = new Date();
    if (type === "PHONE") updateData.phoneVerified = new Date();

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ message: `${type} verified successfully` });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { otp } = await req.json();
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid 6-digit OTP code" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: "Phone number successfully verified",
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

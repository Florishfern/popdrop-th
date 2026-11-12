import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { otp } = await req.json();
    if (!otp) {
      return NextResponse.json({ error: "OTP code is required" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: "Phone number successfully verified",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

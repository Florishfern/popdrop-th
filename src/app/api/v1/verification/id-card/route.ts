import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { documentUrl } = await req.json();
    if (!documentUrl) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: "Identity document submitted for verification",
      status: "Pending",
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

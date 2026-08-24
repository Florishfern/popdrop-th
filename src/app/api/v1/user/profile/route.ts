import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    firstName: "Michael",
    lastName: "Rodriguez",
    username: "PandaMon_35",
    email: "Rodriguez@gmail.com",
    phone: "(213) 555-1234",
    country: "United States of America",
    cityState: "California, USA",
    postalCode: "ERT 62574",
    taxId: "AS56417896",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=PandaMon",
    isEmailVerified: true,
    isPhoneVerified: false,
    kycStatus: "Unverified",
    totalSalesCount: 45,
  });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: body,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

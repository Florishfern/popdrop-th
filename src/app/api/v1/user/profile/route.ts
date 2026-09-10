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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        sellerInfo: {
          select: {
            isVerifiedDocument: true,
            idCardImageUrl: true,
            idCardStatus: true,
            hasTopSellerBadge: true,
            totalSalesCount: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, phone, idCardImageUrl } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (phone !== undefined) updateData.phone = phone;

    // Handle SellerInfo updates
    let sellerInfoUpdate = undefined;
    if (idCardImageUrl !== undefined) {
      sellerInfoUpdate = {
        upsert: {
          create: { idCardImageUrl, idCardStatus: "PENDING" },
          update: { idCardImageUrl, idCardStatus: "PENDING" },
        }
      };
    }

    if (sellerInfoUpdate) {
      updateData.sellerInfo = sellerInfoUpdate;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        sellerInfo: {
          select: {
            isVerifiedDocument: true,
            idCardImageUrl: true,
            idCardStatus: true,
            hasTopSellerBadge: true,
            totalSalesCount: true,
          }
        }
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

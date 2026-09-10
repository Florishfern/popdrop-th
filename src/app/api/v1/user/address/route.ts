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

    const address = await prisma.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' }, // Get default first, or any if no default
    });

    return NextResponse.json(address || {});
  } catch (error) {
    console.error("Error fetching address:", error);
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
    const { addressLine, city, country, postalCode } = body;

    // Check if user already has an address
    const existingAddress = await prisma.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' }
    });

    let updatedAddress;

    if (existingAddress) {
      updatedAddress = await prisma.address.update({
        where: { id: existingAddress.id },
        data: { 
          street: addressLine !== undefined ? addressLine : existingAddress.street,
          province: city !== undefined ? city : existingAddress.province,
          postalCode: postalCode !== undefined ? postalCode : existingAddress.postalCode,
        }
      });
    } else {
      updatedAddress = await prisma.address.create({
        data: {
          userId: session.user.id,
          street: addressLine || "",
          province: city || "",
          postalCode: postalCode || "",
          name: "",
          phone: "",
          subdistrict: "",
          district: "",
          isDefault: true
        }
      });
    }

    return NextResponse.json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

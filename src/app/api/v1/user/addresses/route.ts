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

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
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
    
    // Check if user has any existing addresses
    const existingCount = await prisma.address.count({
      where: { userId: session.user.id }
    });
    
    const isDefault = body.isDefault || existingCount === 0;
    
    // If setting as default, unset others first
    if (isDefault && existingCount > 0) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        name: body.name,
        phone: body.phone,
        street: body.street,
        subdistrict: body.subdistrict,
        district: body.district,
        province: body.province,
        postalCode: body.postalCode,
        isDefault,
      }
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

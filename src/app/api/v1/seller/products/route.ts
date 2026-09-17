import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, price, startTime, endTime, description, imageUrl } = body;

    if (!title || !category || !price || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, category, price, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Parse the requested times from the frontend
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    // Fetch user and seller info to verify prerequisites
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        creditCards: true,
        sellerInfo: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const missingRequirements = [];
    
    if (!user.phoneVerified) {
      missingRequirements.push("phone_verified");
    }
    if (user.creditCards.length === 0) {
      missingRequirements.push("credit_card");
    }
    if (!user.sellerInfo?.isVerifiedDocument && user.sellerInfo?.idCardStatus !== "APPROVED") {
      missingRequirements.push("identity_verified");
    }
    if (!user.sellerInfo?.bankAccountNo) {
      missingRequirements.push("bank_account");
    }

    if (missingRequirements.length > 0) {
      return NextResponse.json(
        { 
          error: "Prerequisites missing", 
          missingRequirements 
        },
        { status: 403 }
      );
    }

    // Create the product in the database
    const newProduct = await prisma.product.create({
      data: {
        sellerId: session.user.id,
        title,
        category,
        startPrice: Number(price),
        currentPrice: Number(price),
        description: description || "",
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        status: "LIVE",
        images: {
          create: [
            {
              imageUrl: imageUrl || "/images/hirono.png",
              sortOrder: 0
            }
          ]
        }
      },
      include: {
        images: true
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product listed successfully",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

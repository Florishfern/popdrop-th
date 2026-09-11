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
    const { title, category, price, endTime, description, imageUrl } = body;

    if (!title || !category || !price || !endTime) {
      return NextResponse.json(
        { error: "Title, category, price, and end time are required" },
        { status: 400 }
      );
    }

    // Parse the requested endTime from the frontend
    const parsedEndTime = new Date(endTime);

    // Create the product in the database
    const newProduct = await prisma.product.create({
      data: {
        sellerId: session.user.id,
        title,
        category,
        startPrice: Number(price),
        currentPrice: Number(price),
        description: description || "",
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

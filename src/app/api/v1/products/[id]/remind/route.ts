import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    // Check if reminder already exists
    const existingReminder = await prisma.productReminder.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingReminder) {
      // Toggle off (delete)
      await prisma.productReminder.delete({
        where: { id: existingReminder.id },
      });
      return NextResponse.json({ success: true, isReminded: false, message: "Reminder removed" });
    } else {
      // Toggle on (create)
      await prisma.productReminder.create({
        data: {
          userId: session.user.id,
          productId,
        },
      });
      return NextResponse.json({ success: true, isReminded: true, message: "Reminder set" });
    }
  } catch (error) {
    console.error("Toggle Reminder Error:", error);
    return NextResponse.json(
      { message: "Failed to toggle reminder" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ isReminded: false }); // Don't throw 401 for GET, just return false
    }

    const { id: productId } = await params;

    const existingReminder = await prisma.productReminder.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    return NextResponse.json({ isReminded: !!existingReminder });
  } catch (error) {
    console.error("Get Reminder Error:", error);
    return NextResponse.json(
      { message: "Failed to get reminder status" },
      { status: 500 }
    );
  }
}

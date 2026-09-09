import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Missing passwords" }, { status: 400 });
    }

    // Get user from database to verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password_hash: true }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ message: "User does not have a credential password set up" }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password_hash: hashedNewPassword }
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

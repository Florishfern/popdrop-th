import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await prisma.chaosEventLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch chaos logs:", error);
    return NextResponse.json({ error: "Failed to fetch chaos logs" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.chaosEventLog.deleteMany({});
    return NextResponse.json({ message: "Chaos event logs cleared successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to clear chaos logs:", error);
    return NextResponse.json({ error: "Failed to clear chaos logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { type, action, message, details } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    const log = await prisma.chaosEventLog.create({
      data: {
        type: type || "system",
        action: action || "info",
        message,
        details: details || null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Failed to create chaos log:", error);
    return NextResponse.json({ error: "Failed to create chaos log" }, { status: 500 });
  }
}

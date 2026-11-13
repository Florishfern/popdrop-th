import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Add a force-dynamic export to ensure this route isn't statically cached
export const dynamic = 'force-dynamic';

declare global {
  var __isAppFrozen: boolean | undefined;
}

export async function GET() {
  try {
    // 1. In-memory check for Single-Node Chaos Freeze (Target Draining & Zero Downtime HA)
    if (global.__isAppFrozen) {
      return NextResponse.json(
        { status: "Unhealthy", message: "Simulated App Freeze on this container (ALB Draining & ECS Self-Healing)" },
        { status: 500 }
      );
    }

    // 2. Health check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: "Healthy" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "Error", message: "Failed to connect to database" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Add a force-dynamic export to ensure this route isn't statically cached
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chaosState = await prisma.chaosState.findUnique({
      where: { id: "global" },
    });

    if (chaosState?.isAppFrozen) {
      // Simulate App Freeze: Hang the request indefinitely (or long enough to trigger a timeout)
      // For demonstration purposes, we will return a 500 status to simulate a crash immediately.
      // Alternatively, we could do: await new Promise(() => {}); // This would actually freeze the request
      return NextResponse.json(
        { status: "Unhealthy", message: "Simulated App Freeze (Timeout/Crash)" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "Healthy" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "Error", message: "Failed to connect to database" }, { status: 500 });
  }
}

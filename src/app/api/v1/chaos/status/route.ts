import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let chaosState = await prisma.chaosState.findUnique({
      where: { id: "global" },
    });

    if (!chaosState) {
      chaosState = await prisma.chaosState.create({
        data: { id: "global" }
      });
    }

    return NextResponse.json(chaosState, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chaos status" }, { status: 500 });
  }
}

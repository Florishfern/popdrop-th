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

    const { topic, description, attachmentUrl } = await req.json();
    if (!topic || !description) {
      return NextResponse.json({ error: "Topic and description are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        topic,
        description,
        attachmentUrl: attachmentUrl || null,
        status: "OPEN"
      }
    });

    // Simulate dispatching email notification
    console.log(`[Email Service] Confirmation email sent for Ticket #${ticket.id} (Topic: ${topic})`);

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: "Ticket created successfully",
      details: { topic, description, attachmentUrl },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

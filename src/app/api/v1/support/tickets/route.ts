import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, description, attachmentUrl } = await req.json();
    if (!topic || !description) {
      return NextResponse.json({ error: "Topic and description are required" }, { status: 400 });
    }

    const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Simulate dispatching email notification (AWS SES / SendGrid API call)
    console.log(`[Email Service] Confirmation email sent for Ticket #${ticketId} (Topic: ${topic})`);

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Ticket created and confirmation email dispatched",
      details: { topic, description, attachmentUrl },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

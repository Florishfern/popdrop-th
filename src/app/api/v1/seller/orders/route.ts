import { NextResponse } from "next/server";

export async function GET() {
  const orders = [
    {
      id: "INV_000076",
      activity: "Hirono Little Mischief",
      type: "Art Toy",
      imageUrl: "/images/hirono.png",
      price: 25500,
      status: "Completed",
      date: "17 Apr, 2026 03:45 PM",
      carrier: "Kerry Express",
      trackingNumber: "KRY-88291039",
    },
    {
      id: "INV_000075",
      activity: "Charizard Base Set Holo",
      type: "Trading Card",
      imageUrl: "/images/pokemon.png",
      price: 32750,
      status: "Pending",
      date: "15 Apr, 2026 11:30 AM",
    },
    {
      id: "INV_000074",
      activity: "Gundam RX-78-2 PG",
      type: "Model",
      imageUrl: "/images/gundum.png",
      price: 40200,
      status: "Completed",
      date: "15 Apr, 2026 12:00 PM",
      carrier: "Flash Express",
      trackingNumber: "TH-09218204",
    },
    {
      id: "INV_000073",
      activity: "Skullpanda Action Cut",
      type: "Art Toy",
      imageUrl: "/images/skull.png",
      price: 50200,
      status: "In Progress",
      date: "14 Apr, 2026 09:15 PM",
    },
    {
      id: "INV_000072",
      activity: "Mickey Mouse Vintage Holo",
      type: "Trading Card",
      imageUrl: "/images/mickey_card.avif",
      price: 15900,
      status: "Completed",
      date: "10 Apr, 2026 06:00 AM",
      carrier: "Thailand Post",
      trackingNumber: "EMS-4920194",
    },
  ];

  return NextResponse.json(orders);
}

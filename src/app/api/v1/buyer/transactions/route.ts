import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const status = searchParams.get("status") || "All";

  const transactions = [
    {
      id: "INV_000082",
      productName: "Labubu Macaron Series",
      price: 4500,
      status: "Completed",
      date: "18 Apr, 2026 10:15 AM",
      carrier: "Kerry Express",
      trackingNumber: "KRY-88291039",
      imageUrl: "/images/hirono.png",
    },
    {
      id: "INV_000079",
      productName: "Hirono Little Mischief",
      price: 2800,
      status: "In Transit",
      date: "17 Apr, 2026 03:45 PM",
      carrier: "Flash Express",
      trackingNumber: "FLS-99120301",
      imageUrl: "/images/hirono.png",
    },
    {
      id: "INV_000076",
      productName: "Charizard Holographic Base Set",
      price: 25500,
      status: "Processing",
      date: "16 Apr, 2026 01:20 PM",
      carrier: null,
      trackingNumber: null,
      imageUrl: "/images/hirono.png",
    },
    {
      id: "INV_000072",
      productName: "Skullpanda City of Night",
      price: 3200,
      status: "Unpaid",
      date: "15 Apr, 2026 09:30 AM",
      carrier: null,
      trackingNumber: null,
      imageUrl: "/images/hirono.png",
    },
  ];

  let filtered = [...transactions];
  if (search) {
    filtered = filtered.filter(
      (item) => item.productName.toLowerCase().includes(search) || item.id.toLowerCase().includes(search)
    );
  }
  if (status && status !== "All") {
    filtered = filtered.filter((item) => item.status === status);
  }

  return NextResponse.json(filtered);
}

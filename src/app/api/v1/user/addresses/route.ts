import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "addr_1",
      name: "Michael Rodriguez",
      phone: "081-234-5678",
      street: "99/1 ซอย สุขุมวิท 21 (อโศก)",
      subdistrict: "คลองเตยเหนือ",
      district: "วัฒนา",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      isDefault: true,
    },
    {
      id: "addr_2",
      name: "Michael Rodriguez (Office)",
      phone: "02-999-8888",
      street: "55 อาคารออฟฟิศ ทาวเวอร์ ชั้น 18 ถนนพระราม 9",
      subdistrict: "ห้วยขวาง",
      district: "ห้วยขวาง",
      province: "กรุงเทพมหานคร",
      postalCode: "10310",
      isDefault: false,
    },
  ]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...body,
    };
    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, category, price, description, imageUrl } = body;

  if (!title || !category || !price) {
    return NextResponse.json(
      { error: "Title, category, and price are required" },
      { status: 400 }
    );
  }

  const newProduct = {
    id: `prod_${Date.now()}`,
    title,
    category,
    price: Number(price),
    description: description || "",
    imageUrl: imageUrl || "/images/hirono.png",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(
    {
      success: true,
      message: "Product listed successfully",
      product: newProduct,
    },
    { status: 201 }
  );
}

import { NextResponse } from "next/server";
import { getAllProducts } from "@/services/api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";

  const products = getAllProducts();
  const related = products
    .filter(p => p.category.toLowerCase() === category.toLowerCase() && p.id !== productId)
    .slice(0, 4);

  return NextResponse.json(related);
}

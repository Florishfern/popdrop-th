import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category") || "";

    // Find the category of this product if not explicitly supplied
    let category = categoryParam;
    if (!category && productId) {
      const current = await prisma.product.findUnique({
        where: { id: productId },
        select: { category: true }
      });
      if (current?.category) {
        category = current.category;
      }
    }

    if (!category) {
      return NextResponse.json([]);
    }

    const catLower = category.toLowerCase().trim();

    // Strictly match the same category type
    let categoryCondition: any = { category: { equals: category } };

    if (catLower.includes("card") || catLower.includes("pokemon") || catLower.includes("lorcana")) {
      categoryCondition = {
        OR: [
          { category: { equals: "Trading Card" } },
          { category: { equals: "Card" } },
          { category: { contains: "card" } },
          { category: { contains: "pokemon" } },
          { category: { contains: "lorcana" } }
        ]
      };
    } else if (catLower.includes("art toy") || catLower.includes("toy") || catLower.includes("blind box")) {
      categoryCondition = {
        OR: [
          { category: { equals: "Art Toy" } },
          { category: { contains: "art toy" } },
          { category: { contains: "toy" } },
          { category: { contains: "blind box" } }
        ]
      };
    } else if (catLower.includes("model") || catLower.includes("gundam") || catLower.includes("figure")) {
      categoryCondition = {
        OR: [
          { category: { equals: "Model" } },
          { category: { contains: "model" } },
          { category: { contains: "gundam" } },
          { category: { contains: "figure" } }
        ]
      };
    }

    const products = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: { notIn: ["DRAFT"] },
        ...categoryCondition
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1
        },
        seller: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { bids: true }
        }
      }
    });

    const formatted = products.map((p: any) => ({
      id: p.id,
      sellerId: p.sellerId,
      title: p.title,
      description: p.description,
      currentBid: p.currentPrice,
      price: p.startPrice,
      minBidStep: Math.round(p.startPrice * 0.05),
      startTime: p.startTime.toISOString(),
      endTime: p.endTime.toISOString(),
      status: p.status,
      isAuction: true,
      imageUrl: p.images.length > 0 ? p.images[0].imageUrl : "https://via.placeholder.com/300",
      category: p.category || category,
      seller: {
        id: p.seller?.id || "unknown",
        name: p.seller?.name || "Seller",
        avatar: p.seller?.image || "https://api.dicebear.com/7.x/bottts/svg?seed=seller",
        totalSalesCount: 0
      },
      viewsCount: 0,
      likesCount: p._count?.bids || 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return NextResponse.json([]);
  }
}

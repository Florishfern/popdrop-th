import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const sort = searchParams.get("sort") || "popular";
    const isLive = searchParams.get("isLive") === "true";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build the Prisma where clause dynamically
    const whereClause: any = {
      status: { not: "DRAFT" }
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (isLive) {
      whereClause.status = "LIVE";
      whereClause.endTime = { gt: new Date() };
    }

    // Determine orderBy based on sort parameter
    let orderBy: any = { createdAt: 'desc' }; // fallback newest
    if (sort === "ending_soon") {
      orderBy = { endTime: 'asc' };
    } else if (sort === "price_asc") {
      orderBy = { currentPrice: 'asc' };
    } else if (sort === "price_desc") {
      orderBy = { currentPrice: 'desc' };
    } else if (sort === "popular") {
      // Mock popular by sorting by highest bids or something, for now just desc by price
      orderBy = { currentPrice: 'desc' }; 
    }

    // Run count and findMany in a transaction for pagination
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1
          },
          seller: {
            select: { name: true, image: true, id: true }
          },
          _count: {
            select: { bids: true }
          }
        }
      })
    ]);

    // Map Prisma response to match the frontend expected structure
    const formattedProducts = products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      currentBid: p.currentPrice,
      price: p.startPrice,
      startTime: p.startTime.toISOString(),
      endTime: p.endTime.toISOString(),
      status: p.status,
      isAuction: true, // simplified for now
      imageUrl: p.images.length > 0 ? p.images[0].imageUrl : "https://via.placeholder.com/300",
      category: p.category || "Art Toy",
      seller: {
        id: p.seller?.id || "unknown",
        name: p.seller?.name || "Unknown Seller",
        avatar: p.seller?.image || "https://api.dicebear.com/7.x/bottts/svg?seed=seller",
        totalSalesCount: 0
      },
      viewsCount: 0, // Not in DB yet
      likesCount: p._count.bids // Use bids count as a proxy for engagement
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "popular";
    const isLive = searchParams.get("isLive") === "true";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Ensure baseline diversity in demo categories if DB only has Trading Cards or 1 category
    try {
      const artToyCount = await prisma.product.count({
        where: {
          OR: [
            { category: { equals: "Art Toy" } },
            { category: { contains: "toy" } },
            { category: { contains: "Art Toy" } }
          ]
        }
      });

      if (artToyCount === 0) {
        const seller = await prisma.user.findFirst({
          where: { email: { contains: "@" } }
        });

        if (seller) {
          const now = new Date();
          const futureDate = (days: number) => new Date(now.getTime() + days * 86400000);
          const pastDate = (days: number) => new Date(now.getTime() - days * 86400000);

          await prisma.product.create({
            data: {
              sellerId: seller.id,
              title: "Hirono Little Mischief Series",
              category: "Art Toy",
              startPrice: 650,
              currentPrice: 850,
              description: "Hirono Little Mischief Series collectible art toy by POP MART. Authentic blind box figure in mint condition with original box.",
              startTime: pastDate(1),
              endTime: futureDate(5),
              status: "LIVE",
              images: {
                create: [{ imageUrl: "/images/hirono.png", sortOrder: 0 }]
              }
            }
          });

          await prisma.product.create({
            data: {
              sellerId: seller.id,
              title: "Skullpanda City of Night",
              category: "Art Toy",
              startPrice: 750,
              currentPrice: 950,
              description: "Skullpanda City of Night series collectible art toy figure. Includes original collector identity card.",
              startTime: pastDate(1),
              endTime: futureDate(4),
              status: "LIVE",
              images: {
                create: [{ imageUrl: "/images/skull.png", sortOrder: 0 }]
              }
            }
          });

          await prisma.product.create({
            data: {
              sellerId: seller.id,
              title: "Gundam RX-78-2 Ver.Ka Custom",
              category: "Model",
              startPrice: 1800,
              currentPrice: 2400,
              description: "Master Grade 1/100 scale Gundam RX-78-2 Ver.Ka model kit with custom water slide decals and matte protective finish.",
              startTime: pastDate(1),
              endTime: futureDate(6),
              status: "LIVE",
              images: {
                create: [{ imageUrl: "/images/gundum.png", sortOrder: 0 }]
              }
            }
          });
        }
      }
    } catch (seedErr) {
      console.error("Auto-seeding sample category products note:", seedErr);
    }

    // Build the Prisma conditions dynamically
    const conditions: any[] = [
      { status: { notIn: ["DRAFT", "SOLD", "ENDED"] } },
      { endTime: { gt: new Date() } }
    ];

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      });
    }

    if (isLive) {
      conditions.push({
        status: "LIVE",
        endTime: { gt: new Date() }
      });
    }

    if (category && category !== "All Product" && category.toLowerCase() !== "all") {
      const cat = category.toLowerCase().trim();
      if (cat === "art toy" || cat === "arttoy" || cat === "toy") {
        conditions.push({
          OR: [
            { category: { equals: "Art Toy" } },
            { category: { contains: "Art Toy" } },
            { category: { contains: "art toy" } },
            { category: { contains: "toy" } },
            { category: { contains: "blind box" } },
            { category: { contains: "hirono" } }
          ]
        });
      } else if (cat === "trading card" || cat === "tradingcard" || cat === "card") {
        conditions.push({
          OR: [
            { category: { equals: "Trading Card" } },
            { category: { equals: "Card" } },
            { category: { contains: "Trading Card" } },
            { category: { contains: "trading card" } },
            { category: { contains: "card" } },
            { category: { contains: "pokemon" } },
            { category: { contains: "lorcana" } }
          ]
        });
      } else if (cat === "model") {
        conditions.push({
          OR: [
            { category: { equals: "Model" } },
            { category: { contains: "Model" } },
            { category: { contains: "model" } },
            { category: { contains: "gundam" } },
            { category: { contains: "figure" } }
          ]
        });
      } else {
        conditions.push({
          category: { contains: category }
        });
      }
    }

    const whereClause: any = { AND: conditions };

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
          ProductReminder: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          _count: {
            select: { bids: true }
          }
        }
      })
    ]);

    // Map Prisma response to match the frontend expected structure
    const formattedProducts = products.map((p: any) => ({
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
      isAuction: true, // simplified for now
      isNotified: Array.isArray(p.ProductReminder) && p.ProductReminder.length > 0,
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

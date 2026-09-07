import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        seller: { select: { name: true, image: true, id: true } }
      }
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // Map to frontend structure
    const formattedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      currentBid: product.currentPrice,
      price: product.startPrice,
      minBidStep: 100, // mock step
      endTime: product.endTime.toISOString(),
      status: product.status,
      isAuction: true,
      imageUrl: product.images.length > 0 ? product.images[0].imageUrl : "https://via.placeholder.com/500",
      category: "Art Toys", // Mocked as category is missing in DB
      sellerName: product.seller.name,
      sellerAvatar: product.seller.image,
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

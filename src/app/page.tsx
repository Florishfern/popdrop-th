import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import ProductCard from "@/components/product/ProductCard";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import TopSellerSection from "@/components/home/TopSellerSection";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

async function getProductsForHome() {
  const products = await prisma.product.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      seller: { select: { name: true, image: true, id: true } },
      _count: { select: { bids: true } }
    }
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    currentBid: p.currentPrice,
    price: p.startPrice,
    minBidStep: 100,
    startTime: p.startTime.toISOString(),
    endTime: p.endTime.toISOString(),
    status: p.status,
    isAuction: true,
    imageUrl: p.images.length > 0 ? p.images[0].imageUrl : "https://via.placeholder.com/300",
    category: p.category || "Art Toy",
    seller: {
      id: p.seller?.id || "unknown",
      name: p.seller?.name || "Unknown Seller",
      avatar: p.seller?.image || "https://via.placeholder.com/50",
      totalSalesCount: 0
    },
    viewsCount: 0,
    likesCount: p._count.bids
  }));
}

export default async function Home() {
  const products = await getProductsForHome();

  return (
    <main className="min-h-screen w-full flex flex-col items-center">
      <Navbar />
      <Hero />

      {/* Product Catalog Grid */}
      <section className="w-full max-w-7xl px-6 sm:px-10 lg:px-16 py-12 flex flex-col gap-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans text-black">
              Live Auction
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories Section */}
      <FeaturedCategories />
      
      {/* Top Seller Section */}
      <TopSellerSection />
    </main>
  );
}

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import ProductCard from "@/components/product/ProductCard";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import TopSellerSection from "@/components/home/TopSellerSection";
import { fetchProducts } from "@/services/api";

export default async function Home() {
  const products = await fetchProducts();

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

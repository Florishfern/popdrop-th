"use client";

import { useState, useEffect, useCallback } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { Filter, X, RefreshCw, AlertTriangle } from "lucide-react";

export default function MarketClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [category, setCategory] = useState("All Product");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isLiveBidding, setIsLiveBidding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categories = ["All Product", "Art Toy", "Trading Card", "Model"];

  const fetchProductsFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (category !== "All Product") queryParams.set("category", category);
      if (minPrice) queryParams.set("minPrice", minPrice);
      if (maxPrice) queryParams.set("maxPrice", maxPrice);
      if (isLiveBidding) queryParams.set("isLive", "true");

      const res = await fetch(`/api/v1/products?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch marketplace data");
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: unknown) {
      console.error("[Marketplace] API error:", err instanceof Error ? err.message : err);
      setError("Unable to load products. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [category, minPrice, maxPrice, isLiveBidding]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsFromApi();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProductsFromApi]);

  // Sidebar Component for Desktop & Mobile
  const sidebarContent = (
    <div className="flex flex-col gap-8 w-full">
      {/* Categories */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-lg border-b pb-2">Category</h3>
        <ul className="flex flex-col gap-2">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => {
                  setCategory(cat);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-sm w-full text-left py-2 px-3 rounded-lg transition-colors ${
                  category === cat
                    ? "bg-[var(--color-pop-red)] text-white font-bold"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-lg border-b pb-2">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors"
          />
          <span className="text-neutral-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-lg border-b pb-2">Status</h3>
        <label className="flex items-center gap-3 cursor-pointer group py-1 select-none">
          <input
            type="checkbox"
            checked={isLiveBidding}
            onChange={(e) => setIsLiveBidding(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-[var(--color-pop-red)] focus:ring-[var(--color-pop-red)] cursor-pointer accent-[var(--color-pop-red)]"
          />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-neutral-800 group-hover:text-black transition-colors">
              Live Bidding
            </span>
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">Market Place</h1>
          <p className="text-xs text-neutral-400 font-medium mt-1">AWS S3 Hosted Media & RDS Live Auctions</p>
        </div>

        <button
          className="lg:hidden flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold self-start md:self-auto"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 sticky top-24">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white p-6 shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="w-full flex-1 min-h-[500px]">
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm animate-pulse flex flex-col gap-4">
                  <div className="w-full aspect-square bg-neutral-200 rounded-xl"></div>
                  <div className="h-4 w-1/3 bg-neutral-200 rounded"></div>
                  <div className="h-6 w-3/4 bg-neutral-200 rounded"></div>
                  <div className="flex justify-between items-center mt-auto pt-4">
                    <div className="h-5 w-1/2 bg-neutral-200 rounded"></div>
                    <div className="h-8 w-20 bg-neutral-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error Fallback */
            <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-red-50/50 border border-red-100 rounded-3xl p-8">
              <AlertTriangle size={36} className="text-red-500 mb-3" />
              <p className="text-base font-bold text-red-900 mb-1">{error}</p>
              <p className="text-xs text-red-600 mb-6">Failed to retrieve items from backend server.</p>
              <button
                onClick={fetchProductsFromApi}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          ) : products.length > 0 ? (
            /* Product Card Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard
                    product={product}
                    variant={product.status === "Live Auction" ? "live" : "upcoming"}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="w-full py-20 flex flex-col items-center justify-center text-center text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-3xl p-8">
              <p className="text-lg font-bold text-black mb-1">No products found</p>
              <p className="text-xs text-neutral-500 mb-6">Try adjusting your search or filters.</p>
              <button
                onClick={() => {
                  setCategory("All Product");
                  setMinPrice("");
                  setMaxPrice("");
                  setIsLiveBidding(false);
                }}
                className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

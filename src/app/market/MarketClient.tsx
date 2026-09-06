"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { X, RefreshCw, AlertTriangle, Search, ArrowUpDown, SlidersHorizontal } from "lucide-react";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initial values from searchParams or defaults
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All Product";
  const initialSort = searchParams.get("sort") || "popular";

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState(initialSort);

  const categories = ["All Product", "Art Toy", "Trading Card", "Model"];

  // Update URL params when filters change
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | boolean | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "" || value === false || value === "All Product" || (key === "sort" && value === "popular")) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const queryString = params.toString();
      router.replace(`/market${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [searchParams, router]
  );

  const fetchProductsFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set("search", searchTerm);
      if (category !== "All Product") queryParams.set("category", category);
      if (sortOption) queryParams.set("sort", sortOption);

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
  }, [searchTerm, category, sortOption]);

  // Sync state from URL when URL searchParams change
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "All Product");
    setSortOption(searchParams.get("sort") || "popular");
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsFromApi();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProductsFromApi]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    updateUrlParams({ search: val });
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    updateUrlParams({ category: cat });
  };

  const handleSortChange = (val: string) => {
    setSortOption(val);
    updateUrlParams({ sort: val });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setCategory("All Product");
    setSortOption("popular");
    router.replace("/market", { scroll: false });
  };

  const hasActiveFilters = Boolean(
    searchTerm || category !== "All Product" || sortOption !== "popular"
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-12">
      {/* Category Pills & Sort Bar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        {/* Horizontal Quick Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = category.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Main Marketplace Search Input */}
          <div className="relative w-full sm:w-72 lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search product title, description..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-white border border-neutral-200 text-sm font-medium text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 shadow-sm transition-all placeholder:text-neutral-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <ArrowUpDown size={14} className="text-neutral-500 hidden sm:block" />
            <span className="text-xs font-semibold text-neutral-500 hidden sm:block">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-white border border-neutral-200 rounded-full px-3 py-2.5 sm:py-2 text-xs font-bold text-black focus:outline-none focus:border-black cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <option value="popular">Most Popular</option>
              <option value="ending_soon">Ending Soonest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Listed</option>
              <option value="live_bidding">Live Bidding First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-neutral-100/80 p-3 rounded-2xl border border-neutral-200">
          <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 px-2">
            <SlidersHorizontal size={14} /> Active Filters:
          </span>

          {searchTerm && (
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full text-xs font-semibold text-black border border-neutral-200 shadow-sm">
              Search: &quot;{searchTerm}&quot;
              <button onClick={() => handleSearchChange("")} className="hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          )}

          {category !== "All Product" && (
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full text-xs font-semibold text-black border border-neutral-200 shadow-sm">
              Category: {category}
              <button onClick={() => handleCategoryChange("All Product")} className="hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          )}

          {sortOption !== "popular" && (
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full text-xs font-semibold text-black border border-neutral-200 shadow-sm">
              Sort: {sortOption.replace("_", " ")}
              <button onClick={() => handleSortChange("popular")} className="hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-red-600 hover:underline ml-auto px-2 py-1"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="w-full min-h-[500px]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
          <div className="w-full py-20 flex flex-col items-center justify-center text-center text-neutral-500 bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Search size={28} className="text-neutral-400" />
            </div>
            <p className="text-lg font-bold text-black mb-1">No products found</p>
            <p className="text-xs text-neutral-500 mb-6 max-w-sm">
              We couldn&apos;t find any products matching your current filters or search term.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketClient() {
  return (
    <Suspense fallback={
      <div className="w-full py-24 flex items-center justify-center">
        <RefreshCw className="animate-spin text-neutral-400" size={32} />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}

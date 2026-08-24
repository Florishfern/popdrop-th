import { NextResponse } from "next/server";
import { getAllProducts } from "@/services/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const sort = searchParams.get("sort") || "popular";
  const category = searchParams.get("category");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const isLive = searchParams.get("isLive") === "true";
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "12");

  let products = getAllProducts();

  // Filter out duplicates by ID
  const uniqueMap = new Map();
  products.forEach((p) => uniqueMap.set(p.id, p));
  products = Array.from(uniqueMap.values());

  // 1. Search Filter (Title & Description)
  if (search) {
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
    );
  }

  // 2. Status Filter (Live Auction)
  if (isLive) {
    products = products.filter((p) => p.status === "Live Auction");
  }

  // 3. Category Filter
  if (category && category.toLowerCase() !== "all product") {
    products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  // 4. Price Range Filters
  if (minPrice !== undefined && !isNaN(minPrice)) {
    products = products.filter((p) => p.currentBid >= minPrice);
  }

  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    products = products.filter((p) => p.currentBid <= maxPrice);
  }

  // 5. Sorting Algorithms
  switch (sort) {
    case "popular":
      products.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
      break;
    case "ending_soon":
      products.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
      break;
    case "price_asc":
      products.sort((a, b) => a.currentBid - b.currentBid);
      break;
    case "price_desc":
      products.sort((a, b) => b.currentBid - a.currentBid);
      break;
    case "newest":
      products.sort((a, b) => Number(b.id.replace(/\D/g, "")) - Number(a.id.replace(/\D/g, "")));
      break;
    default:
      products.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
      break;
  }

  // 6. Pagination
  const total = products.length;
  const startIndex = (page - 1) * limit;
  const paginatedProducts = products.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < total;

  return NextResponse.json({
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },
  });
}

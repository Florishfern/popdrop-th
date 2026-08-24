import { Product, BidHistory, BidRequestPayload } from '@/types';

// Default Seller mock profiles
const verifiedSeller = {
  id: 'seller_1',
  name: 'PandaMon_35',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Panda',
  totalSalesCount: 150, // Verified Badge (>= 100)
};

const standardSeller = {
  id: 'seller_2',
  name: 'PopCollector_99',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pop',
  totalSalesCount: 45, // Not verified (< 100)
};

// Mock data for development
export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Mickey Chrome Holo Card',
    category: 'Card',
    imageUrl: '/images/mickey_card.avif',
    currentBid: 5400,
    minBidStep: 100,
    endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    status: 'Live Auction',
    description: 'Ultra rare mickey holographic card.',
    viewsCount: 1240,
    seller: verifiedSeller,
  },
  {
    id: '2',
    title: 'Luffy Pirate King Model',
    category: 'model',
    imageUrl: '/images/luffy.png',
    currentBid: 12000,
    minBidStep: 500,
    endTime: new Date(Date.now() + 43200000).toISOString(),
    status: 'Live Auction',
    description: 'Limited edition Luffy model.',
    viewsCount: 890,
    seller: standardSeller,
  },
  {
    id: '3',
    title: 'Golden Skull Art Toy',
    category: 'art toy',
    imageUrl: '/images/skull.png',
    currentBid: 8500,
    minBidStep: 200,
    endTime: new Date(Date.now() - 10000).toISOString(),
    status: 'Ended',
    description: 'Exclusive golden skull art toy.',
    viewsCount: 340,
    seller: verifiedSeller,
  }
];

let mockBidHistory: BidHistory[] = [
  { id: '1', productId: '1', username: 'user_123', bidAmount: 5300, timestamp: new Date(Date.now() - 50000).toISOString() },
  { id: '2', productId: '1', username: 'crypto_king', bidAmount: 5400, timestamp: new Date().toISOString() },
];

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("popdrop_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (USE_MOCK) {
    // Simulate network request
    return new Promise((resolve) => setTimeout(() => resolve(mockProducts), 500));
  }
  const res = await fetch("/api/v1/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.products || data;
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allProducts = [...mockProducts, ...mockUpcomingProducts];
        const product = allProducts.find(p => p.id === id);
        resolve(product || null);
      }, 300);
    });
  }
  const res = await fetch(`/api/v1/products/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const placeBid = async (payload: BidRequestPayload): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newBid: BidHistory = {
          id: Math.random().toString(36).substr(2, 9),
          productId: payload.productId,
          username: payload.userId,
          bidAmount: payload.bidAmount,
          timestamp: new Date().toISOString(),
        };
        mockBidHistory = [newBid, ...mockBidHistory];

        const allProducts = [...mockProducts, ...mockUpcomingProducts];
        const product = allProducts.find(p => p.id === payload.productId);
        if (product) {
          product.currentBid = payload.bidAmount;
        }

        resolve({ success: true, message: 'ส่งคำขอประมูลเข้าคิวแล้ว!' });
      }, 400); // simulate SQS queue delay
    });
  }
  
  const res = await fetch(`/api/v1/products/${payload.productId}/bids`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to place bid");
  return res.json();
};

export const fetchBidHistory = async (productId: string): Promise<BidHistory[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockBidHistory.filter(b => b.productId === productId));
      }, 200);
    });
  }
  const res = await fetch(`/api/v1/products/${productId}/bids`);
  if (!res.ok) throw new Error("Failed to fetch bid history");
  return res.json();
};

// SRE Chaos Simulation endpoints
export const simulateChaos = async (type: 'cpu' | 'freeze' | 'disk-full' | 'deface'): Promise<{ success: boolean; message: string }> => {
  console.log(`[Chaos] Simulating ${type}`);
  return new Promise(resolve => setTimeout(() => resolve({ success: true, message: `${type} simulation activated` }), 500));
};

// MARKET PAGE MOCK DATA (AWS S3 Hosted Images & RDS Database records)
export const mockUpcomingProducts: Product[] = [
  {
    id: 'm1',
    title: 'Hirono Little Mischief',
    category: 'Art Toy',
    imageUrl: '/images/hirono.png',
    currentBid: 2500,
    minBidStep: 100,
    endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'Live Auction',
    description: 'A deeply emotional Hirono figure.',
    viewsCount: 2150,
    seller: verifiedSeller,
  },
  {
    id: 'm2',
    title: 'Charizard Base Set Holo',
    category: 'Trading Card',
    imageUrl: '/images/pokemon.png',
    currentBid: 150000,
    minBidStep: 5000,
    endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'Upcoming',
    description: 'Holy grail Charizard card.',
    viewsCount: 4500,
    seller: verifiedSeller,
  },
  {
    id: 'm3',
    title: 'Gundam RX-78-2 Perfect Grade',
    category: 'Model',
    imageUrl: '/images/gundum.png',
    currentBid: 9500,
    minBidStep: 500,
    endTime: new Date(Date.now() + 86400000 * 1).toISOString(),
    status: 'Live Auction',
    description: 'Incredibly detailed Perfect Grade RX-78-2.',
    viewsCount: 1820,
    seller: standardSeller,
  },
  {
    id: 'm4',
    title: 'Elsa Limited Edition Doll',
    category: 'Model',
    imageUrl: '/images/elsa.avif',
    currentBid: 12000,
    minBidStep: 500,
    endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'Upcoming',
    description: 'Frozen Elsa limited collector doll.',
    viewsCount: 620,
    seller: standardSeller,
  },
  {
    id: 'm5',
    title: 'Buzz Lightyear Space Ranger',
    category: 'Model',
    imageUrl: '/images/buzz.avif',
    currentBid: 8000,
    minBidStep: 200,
    endTime: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'Live Auction',
    description: 'To infinity and beyond Buzz action figure.',
    viewsCount: 940,
    seller: verifiedSeller,
  },
  {
    id: 'm6',
    title: 'Mickey Mouse Vintage Holo',
    category: 'Trading Card',
    imageUrl: '/images/mickey_card.avif',
    currentBid: 4200,
    minBidStep: 100,
    endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'Upcoming',
    description: 'Vintage Disney trading card.',
    viewsCount: 1100,
    seller: verifiedSeller,
  },
  {
    id: 'm7',
    title: 'Skullpanda Action Cut',
    category: 'Art Toy',
    imageUrl: '/images/skull.png',
    currentBid: 5600,
    minBidStep: 200,
    endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'Live Auction',
    description: 'Skullpanda signature series figure.',
    viewsCount: 3100,
    seller: verifiedSeller,
  },
  {
    id: 'm8',
    title: 'Luffy Gear 5 Portrait of Pirates',
    category: 'Model',
    imageUrl: '/images/luffy.png',
    currentBid: 28000,
    minBidStep: 1000,
    endTime: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: 'Upcoming',
    description: 'P.O.P. Maximum Luffy Gear 5.',
    viewsCount: 5200,
    seller: verifiedSeller,
  },
];

export const fetchMarketProducts = async ({
  category,
  minPrice,
  maxPrice,
  isLiveBidding,
}: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isLiveBidding?: boolean;
}): Promise<Product[]> => {
  if (USE_MOCK) {
    let filtered = [...mockUpcomingProducts];

    if (isLiveBidding) {
      filtered = filtered.filter(p => p.status === 'Live Auction');
    }

    if (category && category.toLowerCase() !== 'all product') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter(p => p.currentBid >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => p.currentBid <= maxPrice);
    }

    return filtered;
  }

  const query = new URLSearchParams();
  if (category) query.append("category", category);
  if (minPrice !== undefined) query.append("minPrice", minPrice.toString());
  if (maxPrice !== undefined) query.append("maxPrice", maxPrice.toString());
  if (isLiveBidding) query.append("isLiveBidding", "true");

  const res = await fetch(`/api/v1/products?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch market products");
  const data = await res.json();
  return data.products || data;
};

export const getAllProducts = (): Product[] => {
  return [...mockUpcomingProducts, ...mockProducts];
};

export const fetchRelatedProducts = async (id: string, category: string): Promise<Product[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allProducts = [...mockUpcomingProducts, ...mockProducts];
        const filtered = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase() && p.id !== id);
        resolve(filtered.slice(0, 4));
      }, 300);
    });
  }

  const res = await fetch(`/api/v1/products/${id}/related?category=${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error("Failed to fetch related products");
  return res.json();
};

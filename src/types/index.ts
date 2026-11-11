export interface Seller {
  id: string;
  name: string;
  avatar: string;
  totalSalesCount: number;
}

export interface Product {
  id: string;
  sellerId?: string;
  highestBidderId?: string | null;
  title: string;
  category: string;
  imageUrl: string;
  model3dUrl?: string; // Optional Spline 3D model link
  currentBid: number;
  minBidStep: number;
  startTime: string; // ISO Date String
  endTime: string; // ISO Date String for Countdown
  status: string;
  description: string;
  viewsCount?: number;
  seller?: Seller;
  isNotified?: boolean;
}

export interface BidHistory {
  id: string;
  productId: string;
  bidderId?: string;
  username: string;
  bidAmount: number;
  timestamp: string;
  avatar?: string | null;
}

export interface BidRequestPayload {
  productId: string;
  bidAmount: number;
  userId: string;
}

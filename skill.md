# Skill: Popdrop Frontend & Cloud-Ready Developer Rules (`skill.md`)

## 🎭 Role & Persona
You are a Senior Frontend Developer & Cloud Architecture Specialist working on **Popdrop (Resilient Bid)**, a luxury Web3/Rare Collectibles platform (Art Toys, Pokémon/Lorcana Cards, Limited Models, and Live Bidding Rooms) designed for high-traffic resilience and seamless AWS Cloud integration.

---

## 🛠️ Tech Stack & Dependencies
- **Framework:** React (Next.js App Router)
- **Styling:** Tailwind CSS (Mobile-First, Responsive)
- **Icons:** `lucide-react`
- **Animations:** `framer-motion`
- **Interactive Card Effect:** `react-parallax-tilt` (Holographic Foil Effect for Pokémon/Lorcana Cards)
- **3D Viewer Effect:** `@splinetool/react-spline` (360° Interactive Model Viewer for Art Toys)
- **API & Data Fetching:** Native Fetch / Axios / SWR or React Query (with built-in polling support)

---

## 🎨 UI/UX & Design System Constraints
*Always strictly reference `design.md` for visual specifications:*
- **Background:** Clean Off-White (`bg-[#F4F4F6]` or `bg-[#F8F9FA]`)
- **Accent Colors:** High Contrast Red (`#E52E2E`), Solid Black (`#000000`), Clean White (`#FFFFFF`)
- **Typography:** `Plus Jakarta Sans` or `Outfit` (Bold headings, clean lowercase aesthetics for subtext)
- **Responsive Layout:** Mobile-first (`sm: 640px`, `md: 768px`, `lg: 1024px`)

---

## 🧱 Component Rules & Features

### 1. Header & Navigation
- **Top Navbar:**
  - Red Mascot Logo (Left)
  - 7 Nav Links: `home`, `collection`, `roadmap`, `rarity`, `mint`, `team`, `faq` (Center)
  - Action Zone (Right): `Connect Wallet` (Black capsule), `Add Product` (Red button), `Profile` (Icon button)
  - Mobile Menu Drawer with staggered entrance animation
- **Hero Category Sub-Bar:**
  - Horizontal scrollable filter pills: `home`, `art toy`, `model`, `Card`, `live bidding room` (with red pulsing Live dot)
  - Integrated Search Input Box

### 2. Product Visual Effects
- **Card Items (Pokémon / Lorcana):** MUST be wrapped with `react-parallax-tilt` for 3D tilt and Holographic Foil reflection effects on hover.
- **Art Toy / Model Items:** Components MUST support 3D Model Viewers (`@splinetool/react-spline` or 3D Render Image fallback).

### 3. Bidding & Catalog Components
- Real-time Countdown Timer on live cards.
- "Bid Now" CTA with fast micro-interactions using `framer-motion`.
- Status Badges: `"Live Auction"`, `"Ended"`.

---

## ☁️ Backend & Cloud Integration Readiness (Zero-Refactor Rules)

To ensure zero code refactoring when connecting Node.js/Python/Go Backend and AWS Cloud Infrastructure (Amazon SQS, RDS MySQL, S3 Bucket), all code MUST strictly follow these architectural integration rules:

### 1. Centralized API Service Layer (`src/services/api.ts` or `src/lib/api.ts`)
- DO NOT hardcode fetch calls inside UI components. All API requests must go through an abstracted API client layer.
- Use environment variables for the API base URL: `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'`.
- Endpoints contract readiness:
  - `GET /api/products` -> Fetch catalog items (Art Toy, Pokémon, Lorcana, Model)[cite: 9]
  - `GET /api/products/:id` -> Fetch single product detail[cite: 9]
  - `POST /api/bids` -> Submit bid request (Triggers Amazon SQS Queue buffer)[cite: 9]
  - `GET /api/bids/history/:id` -> Fetch live bid history table[cite: 9]
  - `POST /api/products` -> Add new product (Upload payload)

### 2. Asynchronous Bidding & Queue Response Logic
- When user clicks **"Bid Now"**, immediately send a `POST /api/bids` payload `{ productId, bidAmount, userId, timestamp }`.
- Handle non-blocking UI response: Display an instant Toast Message/Notification: `"ส่งคำขอประมูลเข้าคิวแล้ว!"` (Request queued successfully!)[cite: 9] without freezing or locking the screen.
- Implement automatic **Polling Strategy (every 2-3 seconds)** on the Bidding Detail page to fetch `GET /api/bids/history/:id` and dynamically update the Current Highest Bid and Live Bid History table[cite: 9].

### 3. Amazon S3 Image Asset Compatibility
- Define all image props and data fields as generic `string` types named `imageUrl`.
- Image components MUST support both local relative paths (`/images/cards/pokemon-1.png`) and full HTTPS Cloud URLs (`https://popdrop-bucket.s3.amazonaws.com/products/...`) seamlessly using Next.js `<Image>` or HTML `<img>` with fallback error handlers.

### 4. SRE Chaos Admin Panel Support (`/admin/chaos`)
- Include dedicated route/page component for `/admin/chaos` containing triggers for SRE Chaos Testing:
  - Button 1: `Simulate High CPU Load` (`POST /api/chaos/cpu`)[cite: 9]
  - Button 2: `Simulate App Freeze` (`POST /api/chaos/freeze`)[cite: 9]
  - Button 3: `Simulate Disk Full` (`POST /api/chaos/disk-full`)[cite: 9]
  - Button 4: `Simulate Defacement` (`POST /api/chaos/deface`)[cite: 9]

---

## 📁 Data Schemas & TypeScript Interfaces (`src/types/index.ts`)

Always use strict TypeScript interfaces matching the RDS Database schema:

```typescript
export interface Product {
  id: string;
  title: string;
  category: 'art toy' | 'model' | 'Card' | 'pokemon' | 'lorcana';
  imageUrl: string;
  model3dUrl?: string; // Optional Spline 3D model link
  currentBid: number;
  minBidStep: number;
  endTime: string; // ISO Date String for Countdown
  status: 'Live Auction' | 'Ended';
  description: string;
}

export interface BidHistory {
  id: string;
  productId: string;
  username: string;
  bidAmount: number;
  timestamp: string;
}

export interface BidRequestPayload {
  productId: string;
  bidAmount: number;
  userId: string;
}
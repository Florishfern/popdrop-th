"use client";

import Image from "next/image";
import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { Product } from "@/types";
import { Bell } from "lucide-react";

interface ProductCardProps {
  product: Product;
  variant?: "live" | "upcoming";
}

export default function ProductCard({ product, variant }: ProductCardProps) {
  const isCard = product.category.toLowerCase() === "card" || product.category.toLowerCase() === "trading card" || product.category === "pokemon" || product.category === "lorcana";
  const isLive = variant ? variant === "live" : product.status === "Live Auction";

  const cardContent = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-lg border border-neutral-100 group flex flex-col">
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-md text-white shadow-sm ${product.status === "Live Auction" ? "bg-red-500 animate-pulse" : "bg-neutral-800"
            }`}
        >
          {product.status}
        </span>
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-square bg-neutral-50 overflow-hidden flex items-center justify-center p-4">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className={`object-contain transition-transform duration-500 ${isCard ? "scale-95" : "group-hover:scale-105"}`}
        />

        {/* Holographic Rainbow Foil Overlay Effect */}
        {isCard && (
          <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none mix-blend-color-dodge bg-gradient-to-tr from-pink-500/30 via-yellow-500/30 via-cyan-500/30 to-purple-500/30">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.6),transparent_70%)]"></div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-5 flex flex-col flex-1 gap-1.5">
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{product.category}</p>
        <h3 className="font-sans font-bold text-base sm:text-lg text-black truncate">{product.title}</h3>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-neutral-500">
              {isLive ? "Current Bid" : "Starting Bid"}
            </span>
            <span className="font-bold text-base sm:text-lg text-[var(--color-pop-red)]">฿{product.currentBid.toLocaleString()}</span>
          </div>
          
          {isLive ? (
            <button className="bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-all">
              Bid Now
            </button>
          ) : (
            <button className="flex items-center gap-1.5 bg-neutral-100 text-black border border-neutral-200 text-xs font-bold px-4 py-2.5 rounded-full hover:bg-neutral-200 transition-all">
              <Bell size={14} />
              Notify Me
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
      {isCard ? (
        <Tilt
          tiltMaxAngleX={15}
          tiltMaxAngleY={15}
          perspective={1000}
          scale={1.05}
          transitionSpeed={1500}
          glareEnable={true}
          glareMaxOpacity={0.4}
          glareColor="#ffffff"
          glarePosition="all"
          className="h-full w-full rounded-2xl"
        >
          {cardContent}
        </Tilt>
      ) : (
        <div className="h-full w-full transition-transform duration-300 hover:scale-[1.02]">
          {cardContent}
        </div>
      )}
    </Link>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Tilt from "react-parallax-tilt";
import { Product } from "@/types";
import { Bell, Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onToggleReminder?: (productId: string, isReminded: boolean) => void;
}

export default function ProductCard({ product, onToggleReminder }: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isOwner = !!(
    currentUserId &&
    (product.seller?.id === currentUserId || product.sellerId === currentUserId)
  );

  const [isNotified, setIsNotified] = useState<boolean>(!!product.isNotified);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    setIsNotified(!!product.isNotified);
  }, [product.isNotified]);

  // Real-time tick every 1 second to automatically flip UPCOMING <-> LIVE when time arrives
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cardCat = (product.category || "").toLowerCase();
  const isCard =
    cardCat === "card" ||
    cardCat === "trading card" ||
    cardCat === "pokemon" ||
    cardCat === "lorcana";

  const startTime = product.startTime ? new Date(product.startTime) : currentTime;
  const endTime = product.endTime ? new Date(product.endTime) : null;
  const isTimeLive = endTime ? endTime > currentTime : true;
  const hasStarted = currentTime >= startTime;
  const isLive =
    (product.status === "Live Auction" || product.status === "LIVE") &&
    isTimeLive &&
    hasStarted;

  const handleNotifyClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOwner) {
      alert("คุณเป็นผู้ขาย ไม่สามารถตั้งการแจ้งเตือนสินค้าของตนเองได้");
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      const res = await fetch(`/api/v1/products/${product.id}/remind`, {
        method: "POST",
      });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/market")}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setIsNotified(!!data.isReminded);
        if (onToggleReminder) {
          onToggleReminder(product.id, !!data.isReminded);
        }
      }
    } catch (err) {
      console.error("Failed to toggle reminder:", err);
    } finally {
      setIsToggling(false);
    }
  };

  const cardContent = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-lg border border-neutral-100 group flex flex-col">
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        {isLive ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shadow-xs bg-[#FDEEEE] text-[#E52E2E] tracking-wider border border-[#FCDADA]">
            LIVE
          </span>
        ) : !hasStarted && isTimeLive ? (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase shadow-xs bg-[#1F1F1F] text-white tracking-wider">
            UPCOMING
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase shadow-xs bg-neutral-200 text-neutral-600 tracking-wider">
            {product.status === "SOLD" ? "SOLD" : "ENDED"}
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-square bg-neutral-50 overflow-hidden flex items-center justify-center p-4">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className={`object-contain transition-transform duration-500 ${
            isCard ? "scale-95" : "group-hover:scale-105"
          }`}
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
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
          {product.category}
        </p>
        <h3 className="font-sans font-bold text-base sm:text-lg text-black truncate">
          {product.title}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-neutral-500">
              {isLive ? "Current Bid" : "Starting Bid"}
            </span>
            <span className="font-bold text-base sm:text-lg text-[var(--color-pop-red)]">
              ฿{product.currentBid.toLocaleString()}
            </span>
          </div>

          {isOwner ? (
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              title="คุณเป็นผู้ขายสินค้านี้"
              className="bg-neutral-100 text-neutral-500 text-xs font-semibold px-3.5 py-2 rounded-full border border-neutral-200 cursor-not-allowed select-none"
            >
              สินค้าของคุณ
            </span>
          ) : isLive ? (
            <span className="bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-all shadow-xs">
              Bid Now
            </span>
          ) : !hasStarted && isTimeLive ? (
            <button
              type="button"
              onClick={handleNotifyClick}
              disabled={isToggling}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs ${
                isNotified
                  ? "bg-black text-white hover:bg-neutral-800"
                  : "bg-[#F5F5F7] text-black hover:bg-neutral-200 border border-neutral-200/50"
              }`}
            >
              {isNotified ? <Check size={14} /> : <Bell size={14} className="text-black" />}
              {isNotified ? "Notified" : "Notify Me"}
            </button>
          ) : (
            <span className="bg-neutral-100 text-neutral-500 text-xs font-bold px-4 py-2.5 rounded-full">
              {product.status === "SOLD" ? "Sold" : "Ended"}
            </span>
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

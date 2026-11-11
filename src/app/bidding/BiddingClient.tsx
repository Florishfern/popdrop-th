"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import { Trophy, Gavel, Clock, CheckCircle2, ArrowRight } from "lucide-react";

type BiddingItem = Product & {
  myHighestBid?: number | null;
  isLeading?: boolean;
  transactionStatus?: string | null;
  wonAmount?: number | null;
};

type TabKey = "upcoming" | "live" | "won";

const steps: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "won", label: "Won" },
];

export default function BiddingClient() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [upcomingItems, setUpcomingItems] = useState<BiddingItem[]>([]);
  const [liveItems, setLiveItems] = useState<BiddingItem[]>([]);
  const [wonItems, setWonItems] = useState<BiddingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBiddingData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/bidding", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUpcomingItems(Array.isArray(data.upcoming) ? data.upcoming : []);
      setLiveItems(Array.isArray(data.live) ? data.live : []);
      setWonItems(Array.isArray(data.won) ? data.won : []);
    } catch (err) {
      console.error("Failed to load bidding items:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBiddingData();
    const pollInterval = setInterval(fetchBiddingData, 4000);
    return () => clearInterval(pollInterval);
  }, [fetchBiddingData, session]);

  // Real-time transition check every second when startTime or endTime is reached
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const shouldMoveToLive = upcomingItems.some(
        (item) => new Date(item.startTime) <= now
      );
      const shouldFinishLive = liveItems.some(
        (item) => new Date(item.endTime) <= now
      );
      if (shouldMoveToLive || shouldFinishLive) {
        fetchBiddingData();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [upcomingItems, liveItems, fetchBiddingData]);

  const handleToggleReminder = (productId: string, isReminded: boolean) => {
    if (!isReminded) {
      setUpcomingItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      fetchBiddingData();
    }
  };

  const getTabCount = (key: TabKey) => {
    if (key === "upcoming") return upcomingItems.length;
    if (key === "live") return liveItems.length;
    return wonItems.length;
  };

  const currentItems =
    activeTab === "upcoming"
      ? upcomingItems
      : activeTab === "live"
      ? liveItems
      : wonItems;

  const getEmptyStateText = () => {
    if (activeTab === "upcoming") {
      return {
        title: "รายการประมูลของคุณว่างเปล่า",
        subtitle: session
          ? "กดปุ่ม Notify Me ที่สินค้าที่กำลังจะเปิดประมูลเพื่อติดตามในหน้านี้"
          : "เข้าสู่ระบบเพื่อดูรายการประมูลของคุณและสัมผัสประสบการณ์ที่ดียิ่งขึ้น",
      };
    }
    if (activeTab === "live") {
      return {
        title: "ไม่มีรายการที่กำลังประมูล",
        subtitle: session
          ? "เมื่อสินค้าที่คุณกด Notify Me ถึงเวลาเปิดประมูล หรือสินค้าที่คุณร่วมประมูลอยู่ จะแสดงที่นี่"
          : "เข้าสู่ระบบเพื่อดูรายการประมูลของคุณและสัมผัสประสบการณ์ที่ดียิ่งขึ้น",
      };
    }
    return {
      title: "ยังไม่มีรายการที่ชนะการประมูล",
      subtitle: session
        ? "เมื่อคุณชนะการประมูลสินค้า รายการที่ชนะจะย้ายมาแสดงในหน้านี้โดยอัตโนมัติ"
        : "เข้าสู่ระบบเพื่อดูรายการประมูลของคุณและสัมผัสประสบการณ์ที่ดียิ่งขึ้น",
    };
  };

  const emptyText = getEmptyStateText();

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Top Stepper Bar (Without Numbers) */}
      <div className="w-full bg-white border-b border-[#EFEFEF]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 h-[84px] flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = activeTab === step.key;
            const count = getTabCount(step.key);
            return (
              <div
                key={step.key}
                className={`flex items-center ${
                  index < steps.length - 1 ? "flex-1" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab(step.key)}
                  className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0 py-2"
                >
                  <span
                    className={`text-[16px] sm:text-[17px] transition-colors ${
                      isActive
                        ? "text-[#141414] font-bold"
                        : "text-[#8C8C8C] font-normal group-hover:text-[#555555]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {count > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? "bg-[#141414] text-white"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>

                {index < steps.length - 1 && (
                  <div className="flex-1 h-[1px] bg-[#DCDCDC] mx-4 sm:mx-8" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-[#F8F8F8] flex flex-col items-center px-6 py-12 min-h-[calc(100vh-180px)]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-neutral-500 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        ) : currentItems.length === 0 ? (
          /* Empty State (Matches Reference Design 100%) */
          <div className="flex-1 flex flex-col items-center justify-center max-w-[560px] w-full text-center py-12">
            {/* Exclamation Rounded-Square Icon */}
            <div className="mb-6 flex items-center justify-center">
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="4"
                  y="4"
                  width="36"
                  height="36"
                  rx="10"
                  stroke="#757575"
                  strokeWidth="2.5"
                />
                <path
                  d="M22 13V24"
                  stroke="#757575"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <circle cx="22" cy="30" r="1.6" fill="#757575" />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#141414] tracking-tight mb-2.5">
              {emptyText.title}
            </h1>

            {/* Subtitle */}
            <p className="text-[14px] sm:text-[15px] text-[#757575] font-normal mb-9">
              {emptyText.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full">
              <Link
                href="/market"
                className="w-full sm:w-[252px] h-[48px] bg-white hover:bg-neutral-50 text-[#141414] font-medium text-[15px] rounded-[10px] flex items-center justify-center transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                ซื้อเลย
              </Link>
              {!session && (
                <Link
                  href="/login?callbackUrl=/bidding"
                  className="w-full sm:w-[252px] h-[48px] bg-[#141414] hover:bg-[#262626] text-white font-medium text-[15px] rounded-[10px] flex items-center justify-center transition-colors"
                >
                  เข้าสู่ระบบ / สมัครสมาชิก
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Populated Grid View */
          <div className="w-full max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-2">
                  <div className="flex-1">
                    <ProductCard
                      product={item}
                      onToggleReminder={handleToggleReminder}
                    />
                  </div>

                  {/* Contextual Status Footer per Tab */}
                  {activeTab === "upcoming" && (
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-neutral-100 shadow-xs flex items-center justify-between text-xs">
                      <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-neutral-700" />
                        เริ่มประมูล:
                      </span>
                      <span className="font-bold text-black">
                        {new Date(item.startTime).toLocaleString("th-TH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {activeTab === "live" && (
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-neutral-100 shadow-xs flex items-center justify-between text-xs">
                      {item.myHighestBid ? (
                        <>
                          <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                            <Gavel size={14} className="text-black" />
                            ราคาที่คุณบิด: <b>฿{item.myHighestBid.toLocaleString()}</b>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              item.isLeading
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-[var(--color-pop-red)]"
                            }`}
                          >
                            {item.isLeading ? "ผู้นำสูงสุด" : "ถูกแซงแล้ว"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                            <Gavel size={14} className="text-[var(--color-pop-red)]" />
                            เปิดประมูลแล้ว!
                          </span>
                          <Link
                            href={`/product/${item.id}`}
                            className="text-[var(--color-pop-red)] font-bold hover:underline flex items-center gap-1"
                          >
                            ไปประมูล <ArrowRight size={12} />
                          </Link>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "won" && (
                    <div className="bg-white rounded-xl px-4 py-3 border border-emerald-100 shadow-xs flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <Trophy size={15} className="text-amber-500" />
                        <span>
                          ชนะที่ ฿{(item.wonAmount || item.currentBid).toLocaleString()}
                        </span>
                      </div>
                      <Link
                        href="/profile"
                        className="inline-flex items-center gap-1 text-black font-bold hover:underline"
                      >
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        ดูคำสั่งซื้อ
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

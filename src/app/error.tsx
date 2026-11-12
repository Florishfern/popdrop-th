"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-pop-bg)] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 text-[var(--color-pop-red)] flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2">
        เกิดข้อผิดพลาดในการโหลดหน้านี้
      </h1>
      <p className="text-sm text-neutral-600 max-w-md mb-8">
        ระบบไม่สามารถโหลดข้อมูลหน้านี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือกลับไปที่หน้ารายการสินค้า
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={16} />
          ลองใหม่อีกครั้ง
        </button>
        <Link
          href="/market"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 text-sm font-bold border border-neutral-200 transition-all shadow-sm"
        >
          <Home size={16} />
          ไปที่ Market
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { AlertTriangle, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-pop-bg)] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">404</h1>
      <h2 className="text-xl font-bold text-neutral-800 mb-2">ไม่พบหน้าที่คุณต้องการ</h2>
      <p className="text-sm text-neutral-600 max-w-md mb-8">
        หน้าที่คุณกำลังค้นหาอาจถูกลบ ย้าย หรือไม่มีอยู่ในระบบ กรุณาตรวจสอบลิงก์อีกครั้ง
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/market"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-bold transition-all shadow-sm"
        >
          <ShoppingBag size={16} />
          ไปยัง Market
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 text-sm font-bold border border-neutral-200 transition-all shadow-sm"
        >
          <Home size={16} />
          หน้าแรก
        </Link>
      </div>
    </div>
  );
}

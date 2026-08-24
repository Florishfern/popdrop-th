"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Layers, 
  Box, 
  Sparkles, 
  MoreHorizontal,
  CircleCheck,
  Clock,
  PackageCheck,
  Plus,
  Eye,
  EyeOff,
  Truck,
  RefreshCw,
  Search
} from "lucide-react";
import { 
  getSellerStats, 
  getSellerOrders, 
  SellerStats, 
  SellerOrder, 
  CreateProductPayload 
} from "@/services/sellerApi";
import SellerDashboardSkeleton from "./SellerDashboardSkeleton";
import AddProductModal from "./AddProductModal";
import UpdateTrackingModal from "./UpdateTrackingModal";
import Toast, { ToastMessage } from "@/components/ui/Toast";
import { useSellerRealtime } from "@/hooks/useSellerRealtime";

export default function SellerDashboard() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [showAccount, setShowAccount] = useState(false);
  const [timeframe, setTimeframe] = useState<"Day" | "Month" | "Year">("Month");
  const accountNumber = "089-2-54912-3";

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  // Modals & Toasts
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<SellerOrder | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch initial Server Data via API Service Layer
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, ordersData] = await Promise.all([
        getSellerStats(),
        getSellerOrders(),
      ]);
      setStats(statsData);
      setOrders(ordersData);
    } catch (err: unknown) {
      console.error("SellerDashboard API Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load seller dashboard data";
      setError(errorMessage);
      addToast("error", "ไม่สามารถดึงข้อมูลจาก API ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  // Hook for Real-time Updates / Polling
  useSellerRealtime((event) => {
    if (event.type === "NEW_ORDER") {
      addToast("info", "มีคำสั่งซื้อใหม่เข้ามาในระบบ!");
      fetchData();
    }
  });

  // Handle successful product creation
  const handleProductCreated = (newProduct: CreateProductPayload) => {
    addToast("success", `ลงขายสินค้า "${newProduct.title}" สำเร็จแล้ว!`);
    fetchData();
  };

  // Handle tracking update
  const handleTrackingUpdated = (orderId: string, carrier: string, trackingNumber: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, carrier, trackingNumber, status: "Completed" } : o
      )
    );
    addToast("success", `อัปเดตเลขพัสดุ ${carrier} (${trackingNumber}) สำหรับ ${orderId} แล้ว`);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold"><CircleCheck size={14} /> Completed</span>;
      case "Pending":
        return <span className="flex items-center gap-1.5 text-[var(--color-pop-red)] text-xs font-bold"><Clock size={14} /> Pending</span>;
      case "In Progress":
        return <span className="flex items-center gap-1.5 text-yellow-600 text-xs font-bold"><PackageCheck size={14} /> In Progress</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((item) => {
    const matchesSearch = item.activity.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "All" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading && !stats) {
    return <SellerDashboardSkeleton />;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-2 pb-16 lg:pb-20">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProductCreated}
        onError={(msg) => addToast("error", msg)}
      />

      <UpdateTrackingModal
        isOpen={!!selectedOrderForTracking}
        orderId={selectedOrderForTracking?.id || null}
        activityName={selectedOrderForTracking?.activity || null}
        currentCarrier={selectedOrderForTracking?.carrier}
        currentTracking={selectedOrderForTracking?.trackingNumber}
        onClose={() => setSelectedOrderForTracking(null)}
        onSuccess={handleTrackingUpdated}
        onError={(msg) => addToast("error", msg)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-10">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans text-black tracking-tight">Seller Dashboard</h2>
          <button 
            onClick={fetchData}
            className="p-2 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto justify-center bg-[var(--color-pop-red)] hover:bg-[var(--color-pop-red-hover)] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus size={18} />
          เพิ่มสินค้า
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="underline text-xs">ลองอีกครั้ง</button>
        </div>
      )}

      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Top Row: Balance & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Balance Card (Left, takes 1 column on LG) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-neutral-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-500 font-bold text-xs sm:text-sm">Total Balance</span>
              </div>
              <div className="flex items-end gap-3 mb-6 sm:mb-8">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
                  ฿{(stats?.totalBalance || 689372).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button className="flex-1 bg-black hover:bg-neutral-800 text-white font-bold py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-colors">
                  <ArrowUpRight size={16} /> Withdraw
                </button>
                <button className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black font-bold py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-colors border border-neutral-200">
                  <ArrowDownLeft size={16} /> Deposit
                </button>
              </div>

              {/* Bank Account / Wallet */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold text-black">Bank Account</span>
                  <span className="text-[10px] sm:text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">Connect</span>
                </div>
                
                <div className="w-full border border-neutral-200 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 shadow-sm relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                        K
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-black truncate">Kasikorn Bank</div>
                        <div className="text-[10px] text-neutral-500 font-medium truncate">ธนาคารกสิกรไทย</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowAccount(!showAccount)}
                      className="p-1.5 hover:bg-white/80 rounded-lg text-neutral-500 hover:text-black transition-colors shrink-0"
                      title={showAccount ? "Hide Account Number" : "Show Account Number"}
                    >
                      {showAccount ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-emerald-100">
                    <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">Account No.</span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-black">
                      {showAccount ? accountNumber : "***-*-*****-*"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid 2x2 (Right, takes 2 columns on LG) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Stat 1: Total Income (Red Theme) */}
            <div className="bg-[var(--color-pop-red)] rounded-3xl p-5 sm:p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden min-h-[140px] sm:min-h-[160px]">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <TrendingUp size={48} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white/90 text-sm sm:text-base">Total Income</span>
                  <div className="relative">
                    <select 
                      value={timeframe} 
                      onChange={(e) => setTimeframe(e.target.value as "Day" | "Month" | "Year")}
                      className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 pr-6 rounded-full text-[11px] font-bold outline-none cursor-pointer transition-colors appearance-none backdrop-blur-sm"
                    >
                      <option value="Day" className="text-black bg-white">Day</option>
                      <option value="Month" className="text-black bg-white">Month</option>
                      <option value="Year" className="text-black bg-white">Year</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-bold text-white">▾</span>
                  </div>
                </div>

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="flex flex-col gap-2 relative z-10 mt-4 sm:mt-6">
                <span className="text-3xl sm:text-4xl font-black">฿{(stats?.totalIncome || 1050000).toLocaleString()}</span>
              </div>
            </div>

            {/* Stat 2: Trading Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-neutral-100 flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-neutral-500 text-sm sm:text-base">Trading Card</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                  <Layers size={18} />
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4 sm:mt-6">
                <span className="text-3xl sm:text-4xl font-black text-black">฿{(stats?.tradingCardSales || 700000).toLocaleString()}</span>
              </div>
            </div>

            {/* Stat 3: Art Toy */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-neutral-100 flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-neutral-500 text-sm sm:text-base">Art Toy</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4 sm:mt-6">
                <span className="text-3xl sm:text-4xl font-black text-black">฿{(stats?.artToySales || 950000).toLocaleString()}</span>
              </div>
            </div>

            {/* Stat 4: Model */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-neutral-100 flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-neutral-500 text-sm sm:text-base">Model</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                  <Box size={18} />
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4 sm:mt-6">
                <span className="text-3xl sm:text-4xl font-black text-black">฿{(stats?.modelSales || 850000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Sales History Table */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-black">Sales History</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-neutral-100 px-3.5 py-2 rounded-full text-xs text-neutral-500 focus-within:ring-2 focus-within:ring-black/10 w-full sm:w-auto">
                <Search size={16} className="text-neutral-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า / Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-black placeholder:text-neutral-400 w-full sm:w-48"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs font-bold bg-neutral-100 px-3.5 py-2 rounded-full outline-none cursor-pointer hover:bg-neutral-200 transition-colors w-full sm:w-auto"
              >
                <option value="All">All Categories</option>
                <option value="Art Toy">Art Toy</option>
                <option value="Trading Card">Trading Card</option>
                <option value="Model">Model</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-4 pl-4 w-12"><input type="checkbox" className="rounded border-neutral-300" /></th>
                  <th className="pb-4">Order ID</th>
                  <th className="pb-4">Activity</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Tracking</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs font-medium text-neutral-400">
                      ไม่พบรายการคำสั่งซื้อที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors group">
                      <td className="py-5 pl-4"><input type="checkbox" className="rounded border-neutral-300" /></td>
                      <td className="py-5 font-medium text-sm text-neutral-600">{item.id}</td>
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-100 shadow-sm">
                            <Image 
                              src={item.imageUrl} 
                              alt={item.activity} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <span className="font-bold text-sm text-black">{item.activity}</span>
                        </div>
                      </td>
                      <td className="py-5 font-bold text-sm text-black">฿{item.price.toLocaleString()}</td>
                      <td className="py-5">{getStatusDisplay(item.status)}</td>
                      <td className="py-5">
                        {item.trackingNumber ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-black">{item.trackingNumber}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">{item.carrier}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedOrderForTracking(item)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-neutral-100 hover:bg-black hover:text-white px-3 py-1.5 rounded-full transition-colors"
                          >
                            <Truck size={14} /> ใส่เลขพัสดุ
                          </button>
                        )}
                      </td>
                      <td className="py-5 text-sm text-neutral-500 font-medium">{item.date}</td>
                      <td className="py-5 text-neutral-300 group-hover:text-neutral-600 transition-colors cursor-pointer">
                        <button
                          onClick={() => setSelectedOrderForTracking(item)}
                          className="p-1 hover:bg-neutral-200 rounded-lg"
                          title="อัปเดตพัสดุ"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

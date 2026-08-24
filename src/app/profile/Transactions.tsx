"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Search, 
  MoreHorizontal, 
  CircleCheck, 
  Clock, 
  Truck, 
  AlertCircle,
  Copy,
  Loader2
} from "lucide-react";
import { getBuyerTransactions, BuyerTransactionItem } from "@/services/profileApi";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [transactions, setTransactions] = useState<BuyerTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        const data = await getBuyerTransactions({
          search: searchTerm,
          status: filterStatus,
        });
        setTransactions(data);
      } catch (err) {
        console.error("Failed to load buyer transactions", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(loadTransactions, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
            <CircleCheck size={14} /> Completed
          </span>
        );
      case "Unpaid":
        return (
          <span className="flex items-center gap-1.5 text-[var(--color-pop-red)] text-xs font-bold">
            <AlertCircle size={14} /> Unpaid
          </span>
        );
      case "Processing":
        return (
          <span className="flex items-center gap-1.5 text-blue-600 text-xs font-bold">
            <Clock size={14} /> To Ship
          </span>
        );
      case "In Transit":
        return (
          <span className="flex items-center gap-1.5 text-yellow-600 text-xs font-bold">
            <Truck size={14} /> In Transit
          </span>
        );
      default:
        return <span className="text-xs font-bold text-neutral-600">{status}</span>;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Outer Card matching Seller Dashboard layout */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-neutral-100">
        
        {/* Header & Filter Controls inside card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-black">Transactions</h3>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
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

            {/* Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold bg-neutral-100 px-3.5 py-2 rounded-full outline-none cursor-pointer hover:bg-neutral-200 transition-colors w-full sm:w-auto"
            >
              <option value="All">All Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Processing">To Ship</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-4 pl-2 pr-6">Order ID</th>
                <th className="pb-4 pr-6">Product</th>
                <th className="pb-4 pr-6">Price</th>
                <th className="pb-4 pr-6">Status</th>
                <th className="pb-4 pr-6">Tracking</th>
                <th className="pb-4 pr-6">Date</th>
                <th className="pb-4 pr-2 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-neutral-50 animate-pulse">
                    <td className="py-5 pl-2 pr-6"><div className="h-4 w-20 bg-neutral-200 rounded"></div></td>
                    <td className="py-5 pr-6"><div className="h-10 w-48 bg-neutral-200 rounded-xl"></div></td>
                    <td className="py-5 pr-6"><div className="h-4 w-16 bg-neutral-200 rounded"></div></td>
                    <td className="py-5 pr-6"><div className="h-4 w-20 bg-neutral-200 rounded"></div></td>
                    <td className="py-5 pr-6"><div className="h-4 w-28 bg-neutral-200 rounded"></div></td>
                    <td className="py-5 pr-6"><div className="h-4 w-24 bg-neutral-200 rounded"></div></td>
                    <td className="py-5 pr-2"></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs font-medium text-neutral-400">
                    ไม่พบประวัติการสั่งซื้อที่คุณค้นหา
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors group">
                    <td className="py-5 pl-2 pr-6 font-medium text-sm text-neutral-600 whitespace-nowrap">{item.id}</td>
                    <td className="py-5 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-100 shadow-sm">
                          <Image 
                            src={item.imageUrl} 
                            alt={item.productName} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                        <span className="font-bold text-sm text-black whitespace-nowrap">{item.productName}</span>
                      </div>
                    </td>
                    <td className="py-5 pr-6 font-bold text-sm text-black whitespace-nowrap">฿{item.price.toLocaleString()}</td>
                    <td className="py-5 pr-6 whitespace-nowrap">{getStatusDisplay(item.status)}</td>
                    <td className="py-5 pr-6 whitespace-nowrap">
                      {item.trackingNumber ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-black">{item.trackingNumber}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">{item.carrier}</span>
                          </div>
                          <button 
                            onClick={() => navigator.clipboard?.writeText(item.trackingNumber || "")}
                            className="text-neutral-400 hover:text-black transition-colors" 
                            title="Copy Tracking"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-neutral-400 italic">Preparing Shipment</span>
                      )}
                    </td>
                    <td className="py-5 pr-6 text-sm text-neutral-500 font-medium whitespace-nowrap">{item.date}</td>
                    <td className="py-5 pr-2 text-right text-neutral-300 group-hover:text-neutral-600 transition-colors cursor-pointer">
                      <button
                        className="p-1 hover:bg-neutral-200 rounded-lg"
                        title="Actions"
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
  );
}

"use client";

import { BadgeCheck, MoreHorizontal } from "lucide-react";

const sellers = [
  { id: 1, name: "PandaMon_35", seed: "Panda", color: "bg-yellow-100", sales: "฿16,786.75", salesCount: 150 },
  { id: 2, name: "Solderman_879", seed: "Solderman", color: "bg-teal-100", sales: "฿15,700.75", salesCount: 120 },
  { id: 3, name: "AiMagine_908", seed: "AiMagine", color: "bg-pink-100", sales: "฿14,786.75", salesCount: 95 },
  { id: 4, name: "Post_Malone", seed: "Post", color: "bg-purple-100", sales: "฿13,786.75", salesCount: 110 },
  { id: 5, name: "@Dogi_980", seed: "Dogi", color: "bg-lime-100", sales: "฿13,786.75", salesCount: 80 },
  { id: 6, name: "SpiderBaby_43", seed: "Spider", color: "bg-cyan-100", sales: "฿12,786.75", salesCount: 200 },
  { id: 7, name: "Nick_Fury", seed: "Nick", color: "bg-orange-100", sales: "฿11,786.75", salesCount: 45 },
  { id: 8, name: "Bishek_Mike", seed: "Bishek", color: "bg-red-100", sales: "฿10,786.75", salesCount: 105 },
  { id: 9, name: "Marion_332", seed: "Marion", color: "bg-indigo-100", sales: "฿9,786.75", salesCount: 30 },
];

export default function TopSellerSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 mb-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-black tracking-tight">
          Top Seller
        </h2>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sellers.map((seller) => (
          <div 
            key={seller.id} 
            className="flex flex-row items-center gap-4 bg-white group cursor-pointer p-4 rounded-2xl transition-shadow border border-neutral-100 shadow-sm hover:shadow-md"
          >
            {/* Left: Avatar Squircle */}
            <div className="relative shrink-0">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${seller.color} flex items-end justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow`}>
                <img 
                  src={`https://api.dicebear.com/7.x/micah/svg?seed=${seller.seed}&backgroundColor=transparent`} 
                  alt={seller.name}
                  className="w-full h-full object-cover translate-y-1 group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              {/* Verified Badge */}
              {seller.salesCount >= 100 && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px] shadow-sm">
                  <BadgeCheck size={20} fill="#3b82f6" stroke="white" strokeWidth={2} />
                </div>
              )}
            </div>
            
            {/* Middle: Info */}
            <div className="flex flex-col flex-grow overflow-hidden">
              <h3 className="font-bold text-sm sm:text-base text-black truncate w-full">
                {seller.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5 truncate">
                {seller.sales}
              </p>
            </div>
            
            {/* Right: More Options Icon */}
            <div className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity px-2">
              <MoreHorizontal size={20} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

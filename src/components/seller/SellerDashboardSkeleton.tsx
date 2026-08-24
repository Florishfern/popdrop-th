"use client";

export default function SellerDashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-2 pb-16 lg:pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div className="h-9 w-64 bg-neutral-200 rounded-2xl"></div>
        <div className="h-11 w-32 bg-neutral-200 rounded-2xl"></div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Row Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Balance Card Skeleton */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-neutral-100 flex flex-col justify-between h-[340px]">
            <div>
              <div className="flex justify-between mb-4">
                <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                <div className="h-6 w-16 bg-neutral-200 rounded-full"></div>
              </div>
              <div className="h-12 w-48 bg-neutral-200 rounded-xl mb-6"></div>
              <div className="flex gap-4 mb-6">
                <div className="h-12 flex-1 bg-neutral-200 rounded-2xl"></div>
                <div className="h-12 flex-1 bg-neutral-200 rounded-2xl"></div>
              </div>
              <div className="h-20 w-full bg-neutral-200 rounded-2xl"></div>
            </div>
          </div>

          {/* Stats Grid 2x2 Skeleton */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between h-[155px]">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 bg-neutral-200 rounded"></div>
                  <div className="w-10 h-10 rounded-full bg-neutral-200"></div>
                </div>
                <div className="h-8 w-36 bg-neutral-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-36 bg-neutral-200 rounded"></div>
            <div className="h-8 w-24 bg-neutral-200 rounded-full"></div>
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 w-full bg-neutral-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const steps = [
  { id: 1, key: "upcoming", label: "Upcoming" },
  { id: 2, key: "live", label: "Live" },
  { id: 3, key: "review", label: "Review" },
];

export default function BiddingClient() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Top Stepper Bar */}
      <div className="w-full bg-white border-b border-[#EFEFEF]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 h-[84px] flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = activeStep === step.id;
            return (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? "flex-1" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
                >
                  <span
                    className={`w-[28px] h-[28px] rounded-[8px] text-[14px] flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#141414] text-white font-medium border border-[#141414]"
                        : "bg-white text-[#A3A3A3] font-normal border-[1.5px] border-[#CCCCCC] group-hover:border-[#999999] group-hover:text-[#666666]"
                    }`}
                  >
                    {step.id}
                  </span>
                  <span
                    className={`text-[16px] transition-colors ${
                      isActive
                        ? "text-[#141414] font-medium"
                        : "text-[#8C8C8C] font-normal group-hover:text-[#555555]"
                    }`}
                  >
                    {step.label}
                  </span>
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
      <div className="flex-1 w-full bg-[#F8F8F8] flex flex-col items-center justify-center px-6 py-24 min-h-[calc(100vh-180px)]">
        <div className="flex flex-col items-center max-w-[560px] w-full text-center">
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
            รายการประมูลของคุณว่างเปล่า
          </h1>

          {/* Subtitle */}
          <p className="text-[14px] sm:text-[15px] text-[#757575] font-normal mb-9">
            เข้าสู่ระบบเพื่อดูรายการประมูลของคุณและสัมผัสประสบการณ์ที่ดียิ่งขึ้น
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full">
            <Link
              href="/market"
              className="w-full sm:w-[252px] h-[48px] bg-white hover:bg-neutral-50 text-[#141414] font-medium text-[15px] rounded-[10px] flex items-center justify-center transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              ซื้อเลย
            </Link>
            <Link
              href="/login?callbackUrl=/bidding"
              className="w-full sm:w-[252px] h-[48px] bg-[#141414] hover:bg-[#262626] text-white font-medium text-[15px] rounded-[10px] flex items-center justify-center transition-colors"
            >
              เข้าสู่ระบบ / สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

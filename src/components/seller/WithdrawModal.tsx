import React, { useState } from "react";
import { X, ArrowUpRight, Banknote } from "lucide-react";
import { requestWithdrawal } from "@/services/sellerApi";

interface WithdrawModalProps {
  isOpen: boolean;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function WithdrawModal({
  isOpen,
  maxAmount,
  onClose,
  onSuccess,
  onError,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 500) {
      onError("จำนวนเงินขั้นต่ำในการถอนคือ 500 บาท");
      return;
    }

    if (withdrawAmount > maxAmount) {
      onError(`ยอดเงินในบัญชีไม่พอ (สูงสุด ${maxAmount.toLocaleString()} บาท)`);
      return;
    }

    try {
      setIsSubmitting(true);
      await requestWithdrawal(withdrawAmount);
      setAmount("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการถอนเงิน";
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-pop-red)]/10 flex items-center justify-center text-[var(--color-pop-red)]">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-black leading-tight">ถอนเงิน (Withdraw)</h2>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">ถอนเงินเข้าบัญชีธนาคาร</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-600">ยอดเงินที่ถอนได้</span>
              <span className="text-lg font-black text-black">฿{maxAmount.toLocaleString()}</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-neutral-700">จำนวนเงินที่ต้องการถอน (฿)</label>
              <input
                type="number"
                placeholder="ระบุจำนวนเงิน (ขั้นต่ำ 500 บาท)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4 text-base text-black outline-none focus:border-black focus:bg-white transition-all font-bold"
                required
              />
              <span className="text-[11px] text-neutral-500 mt-1">*ระบบจะโอนเงินเข้าบัญชี Kasikorn Bank (089-2-54912-3) ภายใน 1-3 วันทำการ</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-md shadow-black/10 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <ArrowUpRight size={18} />
                  ยืนยันการถอนเงิน
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

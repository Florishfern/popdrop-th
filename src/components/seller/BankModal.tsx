"use client";

import { useState } from "react";
import { X, Building2, Check, AlertCircle } from "lucide-react";
import { updateSellerBank } from "@/services/sellerApi";

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBankName?: string | null;
  currentAccountNo?: string | null;
  onSuccess: (bankName: string, bankAccountNo: string) => void;
}

const POPULAR_BANKS = [
  { id: "KBANK", name: "Kasikorn Bank", thaiName: "ธนาคารกสิกรไทย", color: "bg-[#138f2d] text-white", short: "K" },
  { id: "SCB", name: "Siam Commercial Bank", thaiName: "ธนาคารไทยพาณิชย์", color: "bg-[#4e2e7f] text-white", short: "SCB" },
  { id: "BBL", name: "Bangkok Bank", thaiName: "ธนาคารกรุงเทพ", color: "bg-[#1e4598] text-white", short: "BBL" },
  { id: "KTB", name: "Krungthai Bank", thaiName: "ธนาคารกรุงไทย", color: "bg-[#00a6e6] text-white", short: "KTB" },
  { id: "BAY", name: "Krungsri Bank", thaiName: "ธนาคารกรุงศรีอยุธยา", color: "bg-[#fec43b] text-neutral-900", short: "BAY" },
  { id: "TTB", name: "TMBThanachart Bank", thaiName: "ธนาคารทหารไทยธนชาต", color: "bg-[#002d63] text-white", short: "TTB" },
];

export default function BankModal({
  isOpen,
  onClose,
  currentBankName,
  currentAccountNo,
  onSuccess,
}: BankModalProps) {
  const [selectedBank, setSelectedBank] = useState<string>(
    currentBankName || "Kasikorn Bank (ธนาคารกสิกรไทย)"
  );
  const [accountNo, setAccountNo] = useState<string>(currentAccountNo || "");
  const [accountName, setAccountName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAccountNo = accountNo.trim();
    if (!cleanAccountNo) {
      setError("กรุณากรอกเลขบัญชีธนาคาร");
      return;
    }

    if (cleanAccountNo.replace(/\D/g, "").length < 8) {
      setError("เลขบัญชีธนาคารต้องมีอย่างน้อย 8-10 หลัก");
      return;
    }

    setLoading(true);
    try {
      await updateSellerBank(selectedBank, cleanAccountNo);
      onSuccess(selectedBank, cleanAccountNo);
      onClose();
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถบันทึกบัญชีธนาคารได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-black">
              {currentAccountNo ? "แก้ไขบัญชีธนาคาร" : "เพิ่มบัญชีธนาคารสำหรับรับเงิน"}
            </h3>
            <p className="text-xs text-neutral-500">บัญชีสำหรับรับเงินโอนเมื่อการประมูลหรือการขายสำเร็จ</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Select Bank */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">เลือกธนาคาร</label>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_BANKS.map((b) => {
                const isSelected = selectedBank.includes(b.short) || selectedBank.includes(b.name);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBank(`${b.name} (${b.thaiName})`)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${b.color}`}>
                      {b.short}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-800 truncate">{b.thaiName}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{b.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">เลขที่บัญชีธนาคาร</label>
            <input
              type="text"
              required
              placeholder="e.g. 0892549123 หรือ 089-2-54912-3"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-black font-mono text-sm"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">ชื่อบัญชี (ชื่อ-นามสกุล)</label>
            <input
              type="text"
              placeholder="e.g. นายสมชาย ใจดี"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-black text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-4 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-black hover:bg-neutral-800 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                "กำลังบันทึก..."
              ) : (
                <>
                  <Check size={16} /> บันทึกบัญชีธนาคาร
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

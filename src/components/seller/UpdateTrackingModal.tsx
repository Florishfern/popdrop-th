"use client";

import { useState } from "react";
import { X, Truck, Loader2 } from "lucide-react";
import { updateOrderTracking } from "@/services/sellerApi";

interface UpdateTrackingModalProps {
  orderId: string | null;
  activityName: string | null;
  currentCarrier?: string;
  currentTracking?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string, carrier: string, trackingNumber: string) => void;
  onError: (msg: string) => void;
}

export default function UpdateTrackingModal({
  orderId,
  activityName,
  currentCarrier = "Kerry Express",
  currentTracking = "",
  isOpen,
  onClose,
  onSuccess,
  onError,
}: UpdateTrackingModalProps) {
  const [carrier, setCarrier] = useState(currentCarrier);
  const [trackingNumber, setTrackingNumber] = useState(currentTracking);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !orderId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) {
      onError("Please enter a valid tracking number.");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateOrderTracking(orderId, carrier, trackingNumber);
      onSuccess(orderId, carrier, trackingNumber);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update tracking info";
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-black">อัปเดตเลขพัสดุ (Tracking)</h3>
            <p className="text-xs text-neutral-500 font-medium">Order ID: {orderId}</p>
          </div>
        </div>

        <div className="bg-neutral-50 p-3.5 rounded-2xl mb-6 border border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium block">สินค้า:</span>
          <span className="text-sm font-bold text-black">{activityName}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1.5">บริษัทขนส่ง (Carrier)</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-black transition-colors"
            >
              <option value="Kerry Express">Kerry Express</option>
              <option value="Flash Express">Flash Express</option>
              <option value="Thailand Post">Thailand Post (ไปรษณีย์ไทย)</option>
              <option value="J&T Express">J&T Express</option>
              <option value="DHL Express">DHL Express</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1.5">เลขพัสดุ (Tracking Number)</label>
            <input
              type="text"
              placeholder="e.g. KRY-88291039"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-black font-mono transition-colors"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังอัปเดต...
                </>
              ) : (
                "บันทึกเลขพัสดุ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

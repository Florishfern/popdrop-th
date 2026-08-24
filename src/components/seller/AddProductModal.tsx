"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, CheckCircle, Loader2 } from "lucide-react";
import { getPresignedUrl, uploadFileToCloud, createProduct, CreateProductPayload } from "@/services/sellerApi";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: CreateProductPayload) => void;
  onError: (msg: string) => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess, onError }: AddProductModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Art Toy" | "Trading Card" | "Model">("Art Toy");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      onError("Please fill in Product Title and Starting Bid/Price.");
      return;
    }

    try {
      setIsSubmitting(true);
      let finalImageUrl = "/images/hirono.png";

      // Cloud Storage Upload Flow with Presigned URL
      if (selectedFile) {
        setIsUploading(true);
        // Step 1: Request Presigned URL from Backend API
        const presigned = await getPresignedUrl(selectedFile.name, selectedFile.type);
        
        // Step 2: Upload File to Cloud Storage with Progress Bar
        await uploadFileToCloud(presigned.uploadUrl, selectedFile, (progress) => {
          setUploadProgress(progress);
        });

        finalImageUrl = presigned.publicUrl;
        setIsUploading(false);
      }

      // Step 3: Submit Product payload to Backend API
      const payload: CreateProductPayload = {
        title,
        category,
        price: Number(price),
        description,
        imageUrl: finalImageUrl,
      };

      await createProduct(payload);
      onSuccess(payload);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create product";
      onError(errorMessage);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-7 right-7 p-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-black mb-8">ลงขายสินค้าใหม่ (Add Product)</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">ชื่อสินค้า (Product Title)</label>
            <input
              type="text"
              placeholder="e.g. Skullpanda Limited Edition Collection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4 text-base text-black outline-none focus:border-black focus:bg-white transition-all"
              required
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">หมวดหมู่ (Category)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "Art Toy" | "Trading Card" | "Model")}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4 text-base text-black outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
              >
                <option value="Art Toy">Art Toy</option>
                <option value="Trading Card">Trading Card</option>
                <option value="Model">Model</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">ราคาเริ่มต้น (Starting Bid ฿)</label>
              <input
                type="number"
                placeholder="2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4 text-base text-black outline-none focus:border-black focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Cloud Storage Image Upload Zone */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">รูปภาพสินค้า (Cloud Storage Upload)</label>
            
            <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-3xl p-6 flex flex-col items-center justify-center text-center relative bg-neutral-50 hover:bg-neutral-100/80 transition-all cursor-pointer">
              {previewUrl ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-2">
                  <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-600 mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-base font-extrabold text-black">คลิกเพื่ออัปโหลดรูปภาพสินค้า</span>
                  <span className="text-xs text-neutral-400 mt-1 font-medium">รองรับ PNG, JPG, WEBP (AWS S3 / Cloudflare R2 Presigned Upload)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Cloud Upload Progress Bar */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1.5">
                  <span>Uploading to Cloud Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-pop-red)] transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">รายละเอียดสินค้า (Description)</label>
            <textarea
              rows={4}
              placeholder="ระบุสภาพสินค้า รายละเอียดกล่อง หรืออุปกรณ์เสริม..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-base text-black outline-none focus:border-black focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 mt-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 rounded-2xl text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-[var(--color-pop-red)] hover:bg-[var(--color-pop-red-hover)] flex items-center gap-2.5 transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังลงขาย...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  ยืนยันลงขายสินค้า
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { 
  MessageSquare, 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { submitSupportTicket } from "@/services/profileApi";
import { getPresignedUrl, uploadFileToCloud } from "@/services/sellerApi";

export default function Helps() {
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ticketId, setTicketId] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TOPICS = [
    "ปัญหาการชำระเงิน",
    "ปัญหาการจัดส่ง",
    "แจ้งบัค/ใช้งานไม่ได้",
    "ติดต่อเรื่องอื่นๆ"
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพประเภท JPG หรือ PNG เท่านั้น");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    
    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic || !description.trim()) {
      alert("กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน");
      return;
    }

    try {
      setIsSubmitting(true);
      let attachmentUrl: string | null = null;

      // Upload attachment if present
      if (imageFile) {
        const { uploadUrl, publicUrl } = await getPresignedUrl(imageFile.name, imageFile.type);
        await uploadFileToCloud(uploadUrl, imageFile);
        attachmentUrl = publicUrl;
      }

      // Submit support ticket to API
      const result = await submitSupportTicket({
        topic,
        description,
        attachmentUrl,
      });

      setTicketId(result.ticketId);
      setShowSuccessModal(true);
      
      // Reset form
      setTopic("");
      setDescription("");
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black flex items-center gap-3">
          <MessageSquare className="text-[var(--color-pop-red)]" size={32} />
          Help Center
        </h1>
        <p className="text-neutral-500 mt-2 font-medium">
          พบปัญหาการใช้งาน หรือต้องการความช่วยเหลือ? ส่งข้อความหาทีมงานของเราได้เลย
        </p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-neutral-100">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Topic Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black uppercase tracking-wider">
              หัวข้อเรื่อง <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={`w-full bg-neutral-50 border px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all appearance-none cursor-pointer
                  ${topic ? "text-black border-neutral-200" : "text-neutral-400 border-neutral-200"}
                  hover:border-black focus:ring-2 focus:ring-black/10 focus:border-black`}
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="black" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
              >
                <option value="" disabled>เลือกหัวข้อปัญหาของคุณ...</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t} className="text-black">{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black uppercase tracking-wider">
              รายละเอียด <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายปัญหาที่คุณพบ หรือข้อสงสัยของคุณให้เราทราบ..."
              rows={5}
              className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3.5 rounded-xl text-sm text-black placeholder:text-neutral-400 font-medium outline-none transition-all hover:border-black focus:ring-2 focus:ring-black/10 focus:border-black resize-none"
            />
          </div>

          {/* Image Attachment (Drag & Drop) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black uppercase tracking-wider">
              แนบรูปภาพประกอบ <span className="text-neutral-400 font-normal lowercase tracking-normal">(ไม่บังคับ)</span>
            </label>
            
            {!imageFile ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                  ${isDragging ? "border-[var(--color-pop-red)] bg-red-50/50" : "border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100/50"}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/jpg" 
                  className="hidden" 
                />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                  ${isDragging ? "bg-red-100 text-[var(--color-pop-red)]" : "bg-white text-neutral-400 shadow-sm"}`}
                >
                  <UploadCloud size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-black mb-1">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs font-medium text-neutral-400">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                </div>
              </div>
            ) : (
              <div className="w-full border border-neutral-200 rounded-2xl p-4 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[var(--color-pop-red)] shadow-sm shrink-0">
                    <ImageIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-black truncate">{imageFile.name}</p>
                    <p className="text-xs font-medium text-neutral-500">{(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={removeImage}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove Image"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !topic || !description.trim()}
            className="w-full bg-[var(--color-pop-red)] hover:bg-red-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold rounded-xl py-4 mt-2 transition-all flex items-center justify-center gap-2 shadow-md disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังส่งข้อความ...
              </>
            ) : (
              "ส่งข้อความ (Submit Ticket)"
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-black mb-1">ส่งข้อความเรียบร้อยแล้ว!</h2>
            <p className="text-xs font-mono font-bold text-neutral-400 mb-3">Ticket ID: #{ticketId}</p>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-8">
              ทีมงานได้รับข้อมูลของคุณแล้ว และจะทำการตรวจสอบพร้อมส่งอีเมลตอบกลับไปยังอีเมลที่ลงทะเบียนไว้โดยเร็วที่สุด
            </p>
            
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold rounded-xl py-4 transition-colors shadow-md"
            >
              ตกลง (OK)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

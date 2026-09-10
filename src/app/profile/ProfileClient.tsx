"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import PaymentSettings from "./PaymentSettings";
import Helps from "./Helps";
import Transactions from "./Transactions";
import { signOut } from "next-auth/react";
import { 
  getUserProfile, 
  uploadAvatarImage, 
  submitKYCDocument,
  sendOtp,
  verifyOtp,
  updateUserProfile,
  changePassword,
  UserProfile 
} from "@/services/profileApi";
import { 
  User, 
  ShieldCheck,
  CreditCard, 
  ArrowRightLeft, 
  LifeBuoy, 
  Trash2,
  LogOut,
  Pencil,
  BadgeCheck,
  Mail,
  Smartphone,
  IdCard,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Loader2,
  X
} from "lucide-react";

export default function ProfileClient() {
  const [activeTab, setActiveTab] = useState("Edit Profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Reset Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState<"EMAIL" | "PHONE">("PHONE");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // KYC Modal / State
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getUserProfile();
        setProfile(data);
      } catch {
        showToast("Error loading user profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploadingAvatar(true);
        setUploadProgress(10);
        const newAvatarUrl = await uploadAvatarImage(file, (percent) => {
          setUploadProgress(percent);
        });
        if (profile) {
          setProfile({ ...profile, avatarUrl: newAvatarUrl });
        }
        showToast("Avatar image uploaded successfully!");
      } catch {
        showToast("Failed to upload avatar image");
      } finally {
        setIsUploadingAvatar(false);
        setUploadProgress(0);
      }
    }
  };

  const handleSendOtp = async (type: "EMAIL" | "PHONE", destination: string) => {
    try {
      setOtpType(type);
      const res = await sendOtp(type, destination);
      if (res.devCode) {
        showToast(`[DEV] OTP Code is: ${res.devCode}`);
      } else {
        showToast(`รหัส OTP ถูกส่งไปยัง ${type === "EMAIL" ? "อีเมล" : "เบอร์โทรศัพท์"} ของคุณแล้ว`);
      }
      setShowOtpModal(true);
    } catch (error: any) {
      showToast(error.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }
    try {
      setIsVerifyingOtp(true);
      await verifyOtp(otpType, otpCode);
      if (profile) {
        if (otpType === "EMAIL") {
          setProfile({ ...profile, isEmailVerified: true });
        } else {
          setProfile({ ...profile, isPhoneVerified: true });
        }
      }
      setShowOtpModal(false);
      setOtpCode("");
      showToast(`ยืนยัน${otpType === "EMAIL" ? "อีเมล" : "เบอร์โทรศัพท์"}เรียบร้อยแล้ว!`);
    } catch {
      showToast("รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleTogglePersonalEdit = async () => {
    if (isEditingPersonal) {
      try {
        setIsSavingPersonal(true);
        const payload = {
          firstName: editForm.firstName || "",
          lastName: editForm.lastName || "",
          phone: editForm.phone || "",
        };
        await updateUserProfile(payload);
        setProfile((prev) => prev ? { ...prev, ...payload } : prev);
        showToast("Personal information updated!");
        fetch("/api/auth/session?update=true", { method: "POST" });
        setIsEditingPersonal(false);
      } catch (e) {
        showToast("Failed to update profile");
      } finally {
        setIsSavingPersonal(false);
      }
    } else {
      setEditForm((prev) => ({
        ...prev,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        phone: profile?.phone,
      }));
      setIsEditingPersonal(true);
    }
  };

  const handleToggleAddressEdit = async () => {
    if (isEditingAddress) {
      try {
        setIsSavingAddress(true);
        const payload = {
          country: editForm.country || "",
          cityState: editForm.cityState || "",
          postalCode: editForm.postalCode || "",
        };
        await updateUserProfile(payload);
        setProfile((prev) => prev ? { ...prev, ...payload } : prev);
        showToast("Address updated!");
        setIsEditingAddress(false);
      } catch (e) {
        showToast("Failed to update address");
      } finally {
        setIsSavingAddress(false);
      }
    } else {
      setEditForm((prev) => ({
        ...prev,
        country: profile?.country,
        cityState: profile?.cityState,
        postalCode: profile?.postalCode,
      }));
      setIsEditingAddress(true);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Please fill in both fields");
      return;
    }
    try {
      setIsChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      showToast("Password updated successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      showToast(e.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleKYCUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsSubmittingKYC(true);
        await submitKYCDocument(file);
        if (profile) {
          setProfile({ ...profile, kycStatus: "Pending" });
        }
        showToast("ยื่นเอกสารยืนยันตัวตนเรียบร้อยแล้ว อยู่ระหว่างตรวจสอบ");
      } catch (error: any) {
        showToast(`เกิดข้อผิดพลาดในการยื่นเอกสาร: ${error.message || ""}`);
      } finally {
        setIsSubmittingKYC(false);
      }
    }
  };

  const sidebarMenu = [
    { name: "Edit Profile", icon: User },
    { name: "Verification", icon: ShieldCheck },
    { name: "Payments", icon: CreditCard },
    { name: "Transactions", icon: ArrowRightLeft },
    { name: "Helps", icon: LifeBuoy },
  ];

  const targetSalesCount = 100;
  const isVerifiedSeller = (profile?.totalSalesCount || 0) >= targetSalesCount;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-[calc(100vh-80px)]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 flex flex-col shrink-0">
        <div className="text-xs font-bold text-neutral-400 mb-4 px-4 uppercase tracking-wider">Profile</div>
        <nav className="flex flex-col gap-1.5 flex-1">
          {sidebarMenu.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === item.name
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <item.icon size={18} strokeWidth={2.5} className={activeTab === item.name ? "text-white" : "text-neutral-400"} />
              {item.name}
            </button>
          ))}
        </nav>

        {/* Danger Zone */}
        <div className="mt-8 space-y-2">
          <button 
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/";
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors group"
          >
            <LogOut size={18} strokeWidth={2.5} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            Sign out
          </button>
          
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors group">
            <Trash2 size={18} strokeWidth={2.5} className="text-red-400 group-hover:text-red-500 transition-colors" />
            Delete account
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl">
        {isLoading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-8 w-48 bg-neutral-200 rounded-lg"></div>
            <div className="h-44 bg-neutral-100 rounded-[2rem]"></div>
            <div className="h-64 bg-neutral-100 rounded-[2rem]"></div>
          </div>
        ) : (
          <>
            {activeTab === "Edit Profile" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black mb-8">Edit Profile</h1>

                <div className="flex flex-col gap-8">
                  {/* Avatar Section */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                    {/* Avatar with Squircle & Badge */}
                    <div className="relative shrink-0">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-[#FEF9C3] overflow-hidden flex items-center justify-center p-2 shadow-inner border border-yellow-200 relative">
                        <Image
                          src={profile?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=PandaMon"}
                          alt="User Avatar"
                          width={128}
                          height={128}
                          unoptimized
                          className="w-full h-full object-cover rounded-[1.5rem]"
                        />
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold rounded-[1.5rem]">
                            <Loader2 size={24} className="animate-spin mb-1" />
                            {uploadProgress}%
                          </div>
                        )}
                      </div>
                      {/* Verified Badge */}
                      {isVerifiedSeller && (
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                          <BadgeCheck size={28} className="text-blue-500 fill-blue-500 stroke-white" strokeWidth={2} />
                        </div>
                      )}
                    </div>

                    {/* Upload Action */}
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarChange} 
                        accept="image/png, image/jpeg, image/jpg" 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="bg-white border border-neutral-200 hover:border-black text-black px-6 py-2.5 rounded-xl text-sm font-bold w-fit transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isUploadingAvatar ? "Uploading..." : "Upload new photo"}
                      </button>
                      <p className="text-xs sm:text-sm text-neutral-500 font-medium leading-relaxed mt-1">
                        At least 800×800 px recommended.<br />
                        JPG or PNG is allowed
                      </p>
                    </div>
                  </div>

                  {/* Personal Information Card */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg sm:text-xl font-bold text-black">Personal information</h3>
                      <button 
                        onClick={handleTogglePersonalEdit}
                        disabled={isSavingPersonal}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                      >
                        {isSavingPersonal ? (
                          <><Loader2 size={14} className="animate-spin" /> Saving...</>
                        ) : isEditingPersonal ? (
                          <>Save <CheckCircle2 size={14} /></>
                        ) : (
                          <>Edit <Pencil size={14} /></>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">First Name</label>
                        {isEditingPersonal ? (
                          <input 
                            className="w-full bg-white border border-neutral-300 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-sm transition-all" 
                            value={editForm.firstName || ""} 
                            onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                            placeholder="e.g. John"
                          />
                        ) : (
                          <div className="w-full bg-neutral-50/50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black min-h-[42px] flex items-center">{profile?.firstName || "-"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">Last Name</label>
                        {isEditingPersonal ? (
                          <input 
                            className="w-full bg-white border border-neutral-300 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-sm transition-all" 
                            value={editForm.lastName || ""} 
                            onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                            placeholder="e.g. Doe"
                          />
                        ) : (
                          <div className="w-full bg-neutral-50/50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black min-h-[42px] flex items-center">{profile?.lastName || "-"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">Username</label>
                        <div className="w-full bg-neutral-50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-neutral-500 min-h-[42px] flex items-center cursor-not-allowed">{profile?.username || "-"}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">Email address</label>
                        <div className="w-full bg-neutral-50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-neutral-500 min-h-[42px] flex items-center cursor-not-allowed">{profile?.email || "-"}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">Phone</label>
                        {isEditingPersonal ? (
                          <input 
                            className="w-full bg-white border border-neutral-300 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-sm transition-all" 
                            value={editForm.phone || ""} 
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            placeholder="e.g. 0812345678"
                          />
                        ) : (
                          <div className="w-full bg-neutral-50/50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black min-h-[42px] flex items-center">{profile?.phone || "-"}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg sm:text-xl font-bold text-black">Address</h3>
                      <button 
                        onClick={handleToggleAddressEdit}
                        disabled={isSavingAddress}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                      >
                        {isSavingAddress ? (
                          <><Loader2 size={14} className="animate-spin" /> Saving...</>
                        ) : isEditingAddress ? (
                          <>Save <CheckCircle2 size={14} /></>
                        ) : (
                          <>Edit <Pencil size={14} /></>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">Country</label>
                        {isEditingAddress ? (
                          <input 
                            className="w-full bg-white border border-neutral-300 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-sm transition-all" 
                            value={editForm.country || ""} 
                            onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                            placeholder="e.g. Thailand"
                          />
                        ) : (
                          <div className="w-full bg-neutral-50/50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black min-h-[42px] flex items-center">{profile?.country || "-"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">City / State</label>
                        {isEditingAddress ? (
                          <input 
                            className="w-full bg-white border border-neutral-300 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-sm transition-all" 
                            value={editForm.cityState || ""} 
                            onChange={(e) => setEditForm({...editForm, cityState: e.target.value})}
                            placeholder="e.g. Bangkok"
                          />
                        ) : (
                          <div className="w-full bg-neutral-50/50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black min-h-[42px] flex items-center">{profile?.cityState || "-"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">Postal Code</label>
                        {isEditingAddress ? (
                          <input 
                            className="w-full bg-white border border-neutral-300 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-sm transition-all" 
                            value={editForm.postalCode || ""} 
                            onChange={(e) => setEditForm({...editForm, postalCode: e.target.value})}
                            placeholder="e.g. 10110"
                          />
                        ) : (
                          <div className="w-full bg-neutral-50/50 border border-neutral-100 px-3 py-2 rounded-lg text-sm sm:text-base font-bold text-black min-h-[42px] flex items-center">{profile?.postalCode || "-"}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2">
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="bg-white border-2 border-neutral-200 hover:border-black text-black px-6 py-3 rounded-2xl text-sm font-bold transition-all w-full sm:w-auto text-center"
                    >
                      Reset Password
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === "Verification" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black mb-8">Identity Verification</h1>
                
                <div className="flex flex-col gap-6">
                  {/* Verified Seller Badge Status */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isVerifiedSeller ? "bg-blue-50 text-blue-600" : "bg-neutral-50 text-neutral-400"}`}>
                          <BadgeCheck size={24} className={isVerifiedSeller ? "fill-blue-600 stroke-blue-50" : ""} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-black mb-1">Verified Seller Badge Status</h3>
                          {isVerifiedSeller ? (
                            <>
                              <p className="text-sm font-medium text-neutral-500 mb-2">ยินดีด้วย! คุณได้รับสัญลักษณ์ Verified Seller เรียบร้อยแล้ว</p>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                                <CheckCircle2 size={14} /> Unlocked / Verified Seller
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-neutral-500 mb-2">
                                ขายสินค้าครบ 100 ชิ้นเพื่อปลดล็อกสัญลักษณ์ Verified Seller บนรูป Profile ของคุณ (ขาดอีก {targetSalesCount - (profile?.totalSalesCount || 0)} ชิ้น)
                              </p>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-500 text-xs font-bold">
                                <AlertCircle size={14} /> Locked
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {!isVerifiedSeller && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs font-bold mb-2">
                          <span className="text-[var(--color-pop-red)]">{profile?.totalSalesCount || 0} ชิ้น</span>
                          <span className="text-neutral-400">{targetSalesCount} ชิ้น</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-pop-red)] rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${((profile?.totalSalesCount || 0) / targetSalesCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Verification */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-black mb-1">Email Address</h3>
                        <p className="text-sm font-medium text-neutral-500 mb-2">{profile?.email}</p>
                        {profile?.isEmailVerified ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                            <CheckCircle2 size={14} /> Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold">
                            <AlertCircle size={14} /> Unverified
                          </div>
                        )}
                      </div>
                    </div>
                    {!profile?.isEmailVerified && (
                      <button 
                        onClick={() => handleSendOtp("EMAIL", profile?.email || "")}
                        className="bg-black hover:bg-neutral-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"
                      >
                        Verify Email
                      </button>
                    )}
                  </div>

                  {/* Phone Verification */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-50 text-neutral-600 flex items-center justify-center shrink-0">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-black mb-1">Phone Number</h3>
                        <p className="text-sm font-medium text-neutral-500 mb-2">{profile?.phone}</p>
                        {profile?.isPhoneVerified ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                            <CheckCircle2 size={14} /> Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold">
                            <AlertCircle size={14} /> Unverified
                          </div>
                        )}
                      </div>
                    </div>
                    {!profile?.isPhoneVerified && (
                      <button 
                        onClick={() => handleSendOtp("PHONE", profile?.phone || "")}
                        className="bg-black hover:bg-neutral-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"
                      >
                        Verify Phone
                      </button>
                    )}
                  </div>

                  {/* ID Card / KYC Verification */}
                  <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-50 text-neutral-600 flex items-center justify-center shrink-0">
                          <IdCard size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-black mb-1">Identity Document</h3>
                          <p className="text-sm font-medium text-neutral-500 mb-2">Government-issued ID card or Passport</p>
                          {profile?.kycStatus === "Verified" ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                              <CheckCircle2 size={14} /> Verified
                            </div>
                          ) : profile?.kycStatus === "Pending" ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold">
                              <Loader2 size={14} className="animate-spin" /> Pending Review
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-bold">
                              <AlertCircle size={14} /> Not Verified
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {profile?.kycStatus !== "Verified" && (
                      <div 
                        onClick={() => kycInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        <input 
                          type="file" 
                          ref={kycInputRef} 
                          onChange={handleKYCUpload} 
                          accept="image/png, image/jpeg, image/jpg, application/pdf" 
                          className="hidden" 
                        />
                        {isSubmittingKYC ? (
                          <Loader2 size={32} className="animate-spin text-black" />
                        ) : (
                          <UploadCloud size={32} className="text-neutral-400" />
                        )}
                        <div className="text-center">
                          <p className="text-sm font-bold text-black">
                            {isSubmittingKYC ? "กำลังอัปโหลดเอกสาร..." : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "Payments" && (
              <PaymentSettings />
            )}

            {/* Transactions Tab */}
            {activeTab === "Transactions" && (
              <Transactions />
            )}

            {/* Helps Tab */}
            {activeTab === "Helps" && (
              <Helps />
            )}
          </>
        )}
      </main>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 relative">
            <button 
              onClick={() => setShowOtpModal(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black p-1 rounded-lg"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-2xl font-black text-black mb-2">Verify {otpType === "EMAIL" ? "Email Address" : "Phone Number"}</h2>
              <p className="text-sm text-neutral-500 font-medium">
                เราได้ส่งรหัส OTP 6 หลักไปยัง {otpType === "EMAIL" ? profile?.email : profile?.phone}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-black uppercase tracking-wider">
                OTP Code
              </label>
              <input 
                type="text" 
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="กรอกรหัส OTP"
                className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3.5 rounded-xl text-center font-mono font-bold text-lg text-black outline-none tracking-widest focus:ring-2 focus:ring-black/10 focus:border-black"
              />
            </div>

            <button 
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold rounded-xl py-4 transition-colors flex items-center justify-center gap-2"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                "ยืนยันรหัส OTP"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 relative">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black p-1 rounded-lg"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-2xl font-black text-black mb-2">Change Password</h2>
              <p className="text-sm text-neutral-500 font-medium">
                Enter your current password and your new password.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-black uppercase tracking-wider">
                  Current Password
                </label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3.5 rounded-xl text-lg text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-black uppercase tracking-wider">
                  New Password
                </label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3.5 rounded-xl text-lg text-black outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                />
              </div>
            </div>

            <button 
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold rounded-xl py-4 transition-colors flex items-center justify-center gap-2"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

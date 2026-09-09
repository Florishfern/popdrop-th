"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FiCamera, FiSave, FiArrowLeft, FiLock } from "react-line-icons/icons";

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [profileRes, addressRes] = await Promise.all([
        fetch("/api/v1/user/profile"),
        fetch("/api/v1/user/address")
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setName(profileData.name || "");
        setEmail(profileData.email || "");
        setImage(profileData.image || "");
      }
      if (addressRes.ok) {
        const addrData = await addressRes.json();
        setAddressLine(addrData.addressLine || "");
        setCity(addrData.city || "");
        setCountry(addrData.country || "");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Create local preview
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      let finalImageUrl = image;

      // 1. Upload new image if selected
      if (selectedFile) {
        const urlRes = await fetch(`/api/v1/user/upload-url?file=${encodeURIComponent(selectedFile.name)}&type=${encodeURIComponent(selectedFile.type)}`);
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        
        const { uploadUrl, publicUrl } = await urlRes.json();
        
        // Upload directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          }
        });

        if (!uploadRes.ok) throw new Error("Failed to upload image to S3");
        finalImageUrl = publicUrl;
      }

      // 2. Update Profile (Name & Image)
      const profileRes = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: finalImageUrl }),
      });

      // 3. Update Address
      const addressRes = await fetch("/api/v1/user/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressLine, city, country }),
      });

      if (!profileRes.ok || !addressRes.ok) {
        throw new Error("Failed to save some profile data");
      }

      // Update NextAuth session
      await update({ name, image: finalImageUrl });

      setMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => router.push("/profile"), 1500);
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message || "An error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/v1/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage({ text: "Password changed successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 pt-32">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/profile" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
            <FiArrowLeft className="text-xl" />
          </Link>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Main Profile Form */}
          <form onSubmit={handleSaveProfile} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-8 mb-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-700 bg-slate-800 relative">
                  {image ? (
                    <Image src={image} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-500">?</div>
                  )}
                  {/* Overlay */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <FiCamera className="text-2xl text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h3 className="font-medium text-lg">Profile Picture</h3>
                <p className="text-sm text-slate-400">Upload a new avatar. Recommended size is 256x256px.</p>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Change Picture
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Email Address (Read-only)</label>
                <input 
                  type="email" 
                  value={email}
                  readOnly
                  className="w-full bg-slate-900/20 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Shipping Address</h3>
            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Address Line</label>
                <input 
                  type="text" 
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="123 Main St, Apt 4B"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Country</label>
                  <input 
                    type="text" 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-medium transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSave />
                )}
                Save Profile
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FiLock className="text-indigo-400" />
              Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 text-sm"
              >
                Update Password
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}

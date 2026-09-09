"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FiEdit2, FiMapPin, FiMail, FiUser, FiPackage, FiAward } from "react-line-icons/icons";

interface Profile {
  name: string;
  email: string;
  image?: string;
}

interface Address {
  addressLine: string;
  city: string;
  country: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

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
        setProfile(await profileRes.json());
      }
      if (addressRes.ok) {
        const addrData = await addressRes.json();
        if (addrData.addressLine) {
          setAddress(addrData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 pt-32">
        {/* Header Section */}
        <div className="relative mb-12">
          {/* Decorative background blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl bg-slate-800">
                {profile?.image ? (
                  <Image
                    src={profile.image}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-500">
                    <FiUser />
                  </div>
                )}
              </div>
              <Link 
                href="/profile/edit"
                className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              >
                <FiEdit2 />
              </Link>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profile?.name || "User"}</h1>
              <div className="flex flex-col md:flex-row gap-4 text-slate-400 items-center md:items-start justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <FiMail className="text-indigo-400" />
                  <span>{profile?.email}</span>
                </div>
                {address && (
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-rose-400" />
                    <span>{address.city}, {address.country}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href="/profile/edit" className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-full text-sm font-medium transition-colors">
                  Edit Profile
                </Link>
                <button className="px-5 py-2.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-full text-sm font-medium transition-colors border border-indigo-500/30">
                  Switch to Seller
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <FiMapPin />
              </div>
              Shipping Address
            </h2>
            
            {address ? (
              <div className="space-y-3 text-slate-300">
                <p className="font-medium text-white">{profile?.name}</p>
                <p>{address.addressLine}</p>
                <p>{address.city}</p>
                <p>{address.country}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No address found.</p>
                <Link href="/profile/edit" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
                  Add Address
                </Link>
              </div>
            )}
          </div>

          {/* Activity Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FiAward />
              </div>
              Recent Activity
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-700/30">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FiPackage />
                </div>
                <div>
                  <p className="text-white font-medium">Won Auction</p>
                  <p className="text-sm text-slate-400">Skullpanda Series - 2 days ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-700/30">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <FiAward />
                </div>
                <div>
                  <p className="text-white font-medium">Placed Bid</p>
                  <p className="text-sm text-slate-400">Hirono Little Mischief - $45.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

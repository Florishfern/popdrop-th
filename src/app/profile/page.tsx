import { Suspense } from "react";
import ProfileClient from "./ProfileClient";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Profile | Popdrop",
  description: "Manage your Popdrop account and profile settings.",
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-medium text-neutral-400">กำลังโหลด...</div>}>
        <ProfileClient />
      </Suspense>
    </main>
  );
}

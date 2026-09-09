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
      <ProfileClient />
    </main>
  );
}

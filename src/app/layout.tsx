import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PopDropTH | Luxury NFT Collection",
  description: "Limited-edition NFT animals with distinct traits. Collect, trade, and build your digital zoo.",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Chaos Engineering: Check for Website Defacement
  let isDefaced = false;
  try {
    const chaosState = await prisma.chaosState.findUnique({
      where: { id: "global" },
      select: { isDefaced: true }
    });
    if (chaosState?.isDefaced) isDefaced = true;
  } catch (error) {
    // Ignore DB errors during layout render
  }

  // Check if current route is admin or API
  let isAdminOrApi = false;
  try {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
    const referer = headersList.get("referer") || "";
    if (
      pathname.startsWith("/admin") || 
      pathname.startsWith("/api") || 
      pathname.startsWith("/chaos") ||
      referer.includes("/admin/chaos") ||
      referer.includes("/chaos")
    ) {
      isAdminOrApi = true;
    }
  } catch {
    // Ignore header resolution errors
  }

  // To trigger CloudFront Origin Failover (500 Error), we throw an error when hacked on public pages.
  // Allow /admin and /api to pass through so SREs can control the chaos console!
  if (isDefaced && !isAdminOrApi) {
    throw new Error("SYSTEM_HACKED");
  }

  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${jakarta.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F4F4F6] text-black">
        {isDefaced ? (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-center p-6">
            <h1 className="text-4xl md:text-6xl font-bold text-red-600 mb-4 animate-pulse uppercase tracking-widest">
              Hacked By Anonymous
            </h1>
            <p className="text-green-500 text-lg md:text-xl">
              Your system security is compromised. All data encrypted.
            </p>
          </div>
        ) : (
          <Providers session={session}>
            {children}
          </Providers>
        )}
      </body>
    </html>
  );
}

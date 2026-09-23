import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import prisma from "@/lib/prisma";
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

  // To trigger CloudFront Origin Failover (500 Error), we must throw an error when hacked.
  if (isDefaced) {
    throw new Error("SYSTEM_HACKED");
  }

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
          <Providers>
            {children}
          </Providers>
        )}
      </body>
    </html>
  );
}

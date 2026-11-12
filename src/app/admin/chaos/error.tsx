"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ChaosAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chaos Admin Error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f0f2f5] p-6 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6 border border-neutral-100">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Chaos Console Warning</h1>
          <p className="text-xs text-neutral-500 font-mono break-all bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            {error.message || "An unexpected error occurred while loading the SRE console."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <RefreshCw size={16} /> Try Again
          </button>
          <Link
            href="/"
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

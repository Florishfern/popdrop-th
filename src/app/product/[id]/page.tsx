"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";

import { ArrowLeft, Sparkles } from "lucide-react";
import Tilt from "react-parallax-tilt";
import Spline from "@splinetool/react-spline";
import { motion } from "framer-motion";

import Navbar from "@/components/layout/Navbar";
import { Product, BidHistory } from "@/types";
import { fetchProductById, fetchBidHistory, placeBid, fetchRelatedProducts } from "@/services/api";
import ProductCard from "@/components/product/ProductCard";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBidding, setIsBidding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProductById(productId).then((data) => {
      setProduct(data);
      if (data) {
        fetchRelatedProducts(productId, data.category).then((related) => {
          setRelatedProducts(related);
        });
      }
      setLoading(false);
    });
  }, [productId]);

  // Polling strategy every 3 seconds for Bid History
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (product?.status === "Live Auction") {
      const poll = () => {
        fetchBidHistory(productId).then((data) => setBidHistory(data));
        // Also refresh product to get latest currentBid
        fetchProductById(productId).then((data) => {
          if (data) setProduct(data);
        });
      };
      poll(); // initial fetch
      interval = setInterval(poll, 3000);
    }
    return () => clearInterval(interval);
  }, [product?.status, productId]);

  const handleBid = async () => {
    if (!product) return;
    setIsBidding(true);

    // Optimistic / Queue placement
    const newBid = product.currentBid + product.minBidStep;
    const payload = {
      productId,
      bidAmount: newBid,
      userId: `user_${Math.floor(Math.random() * 1000)}` // Mock user
    };

    try {
      const response = await placeBid(payload);
      setToastMessage(response.message);

      // Auto hide toast
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBidding(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-pop-bg)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-pop-red)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-neutral-500">Loading Drop...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return <main className="min-h-screen w-full flex items-center justify-center">Product not found.</main>;
  }

  const isCard = product.category.toLowerCase() === "card" || product.category.toLowerCase() === "trading card" || product.category.toLowerCase() === "pokemon" || product.category.toLowerCase() === "lorcana";
  const has3DModel = !!product.model3dUrl;

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[var(--color-pop-bg)]">
      <Navbar />

      <div className="w-full max-w-7xl px-6 sm:px-10 lg:px-16 py-8">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft size={16} />
          back to collection
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          {/* Left: Media Viewer */}
          <div className="w-full lg:w-1/2 flex items-center justify-center bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 relative overflow-hidden min-h-[400px]">
            {isCard ? (
              <Tilt
                tiltMaxAngleX={20}
                tiltMaxAngleY={20}
                perspective={1000}
                scale={1.02}
                transitionSpeed={2000}
                glareEnable={true}
                glareMaxOpacity={0.6}
                glareColor="#ffffff"
                glarePosition="all"
                className="w-full max-w-[400px] aspect-[3/4] relative rounded-xl shadow-2xl"
              >
                <Image src={product.imageUrl} alt={product.title} fill className="object-cover rounded-xl" priority />
              </Tilt>
            ) : has3DModel ? (
              <div className="w-full h-[500px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
                <Spline scene={product.model3dUrl!} />
              </div>
            ) : (
              <div className="relative w-full max-w-[500px] aspect-square animate-float">
                <Image src={product.imageUrl} alt={product.title} fill className="object-contain drop-shadow-2xl" priority />
              </div>
            )}
          </div>

          {/* Right: Bidding Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase">
                {product.category}
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-md text-white ${product.status === "Live Auction" ? "bg-red-500 animate-pulse" : "bg-neutral-400"}`}>
                {product.status}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans text-black mb-4 leading-tight">{product.title}</h1>
            <p className="text-neutral-500 text-sm leading-relaxed mb-8">{product.description}</p>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-8">
              <div className="flex items-end justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Current Highest Bid</span>
                  <div className="text-4xl font-bold text-[var(--color-pop-red)]">฿{product.currentBid.toLocaleString()}</div>
                </div>
                {product.status === "Live Auction" && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ends In</span>
                    <div className="text-xl font-bold text-black font-mono">23:59:59</div>
                  </div>
                )}
              </div>

              {product.status === "Live Auction" ? (
                <button
                  onClick={handleBid}
                  disabled={isBidding}
                  className="w-full bg-black hover:bg-neutral-800 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Sparkles size={18} />
                  {isBidding ? "Processing..." : `Bid Now (฿${(product.currentBid + product.minBidStep).toLocaleString()})`}
                </button>
              ) : (
                <button disabled className="w-full bg-neutral-200 text-neutral-500 py-4 rounded-xl font-bold text-sm cursor-not-allowed">
                  Auction Ended
                </button>
              )}
            </div>

            {/* Live Bid History Table */}
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                Live Bid History
                {product.status === "Live Auction" && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
              </h3>

              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="h-[220px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {bidHistory.length > 0 ? (
                        bidHistory.map((bid) => (
                          <tr key={bid.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-black">{bid.username}</td>
                            <td className="px-6 py-3 font-bold text-[var(--color-pop-red)]">฿{bid.bidAmount.toLocaleString()}</td>
                            <td className="px-6 py-3 text-neutral-400 text-xs text-right">
                              {new Date(bid.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-neutral-400 text-sm font-medium">
                            No bids yet. Be the first!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* You May Also Like Section */}
      {relatedProducts.length > 0 && (
        <div className="w-full max-w-7xl px-6 sm:px-10 lg:px-16 py-16 border-t border-neutral-100 mt-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2"
        >
          <Sparkles size={16} className="text-[var(--color-pop-red)]" />
          {toastMessage}
        </motion.div>
      )}
    </main>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, User, Search, Bell, CheckCircle, Package, Gavel } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

const navLinks = [
  { name: "market", href: "/market" },
  { name: "bidding", href: "/bidding" },
  { name: "seller", href: "/seller" },
];

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/market?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/market");
    }
    setMenuOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setViewAll(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(() => {
    if (session?.user) {
      fetch("/api/v1/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch((err) => console.error("Failed to fetch notifications", err));
    }
  }, [session?.user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Polling every 5 seconds for real-time notification badge
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleToggleNotifications = () => {
    if (!notificationsOpen) {
      fetchNotifications(); // Refresh notifications immediately upon clicking
    } else {
      setViewAll(false);
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/v1/notifications", { method: "PUT" });
    } catch (err) {
      console.error(err);
    }
  };

  const resolveNotificationUrl = (notif: NotificationItem): string => {
    const title = notif.title || "";
    const type = notif.type || "";
    const rawLink = notif.link || "";

    // 1. Won Auction -> /bidding?tab=won
    if (type === "WON" || title.includes("ชนะการประมูล")) {
      return "/bidding?tab=won";
    }

    // 2. Sold / Seller orders / Seller item sold / Ended with no bids -> /seller
    if (
      type === "SOLD" ||
      title.includes("ถูกขายแล้ว") ||
      title.includes("ไม่มีผู้เสนอราคา") ||
      rawLink.startsWith("/seller")
    ) {
      return "/seller";
    }

    // 3. Delivered or Shipped -> /transactions
    if (
      title.includes("จัดส่งสินค้าสำเร็จ") ||
      title.includes("สินค้ากำลังจัดส่ง") ||
      rawLink.startsWith("/transactions") ||
      rawLink.startsWith("/transaction")
    ) {
      return "/transactions";
    }

    // 4. Verification / KYC -> /profile?tab=Verification
    if (title.includes("ยืนยันตัวตน") || rawLink.includes("Verification")) {
      return "/profile?tab=Verification";
    }

    // 5. Outbid or Reminder pointing to /market/<productId> -> convert to /product/<productId>
    if (rawLink.startsWith("/market/")) {
      const parts = rawLink.split("/market/");
      if (parts[1]) {
        return `/product/${parts[1]}`;
      }
    }

    // 6. If rawLink is already a valid non-empty internal link
    if (rawLink && rawLink !== "/" && !rawLink.startsWith("/seller/")) {
      return rawLink;
    }

    return "/market";
  };

  const markAsRead = async (notif: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    try {
      await fetch(`/api/v1/notifications/${notif.id}/read`, { method: "PUT" });
    } catch (err) {
      console.error(err);
    }
    const targetUrl = resolveNotificationUrl(notif);
    router.push(targetUrl);
    setNotificationsOpen(false);
  };

  const displayNotifications = viewAll ? notifications : notifications.slice(0, 4);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "WON":
      case "SOLD":
      case "SUCCESS":
        return { icon: <CheckCircle size={20} className="text-white" />, color: "bg-green-500" };
      case "BID":
      case "OUTBID":
        return { icon: <Gavel size={20} className="text-white" />, color: "bg-orange-500" };
      case "LIVE":
        return { icon: <Gavel size={20} className="text-white" />, color: "bg-purple-500" };
      default:
        return { icon: <Package size={20} className="text-white" />, color: "bg-blue-500" };
    }
  };

  return (
    <>
      <nav className="w-full px-6 sm:px-10 lg:px-16 py-6 lg:py-8 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 z-50 shrink-0 cursor-pointer hover:opacity-85 transition-opacity" title="PopDropTH Home">
          <div className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-pop-red)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
          </div>
          <span className="font-bold text-xl sm:text-2xl text-black">PopDropTH</span>
        </Link>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-sans text-xs sm:text-sm lowercase tracking-normal transition-colors ${isActive ? "text-black font-bold" : "text-neutral-500 hover:text-black"
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right: Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search Bar Removed */}

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={handleToggleNotifications}
              className="relative w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-sm hover:bg-neutral-100 flex items-center justify-center text-black transition-all active:scale-95 shrink-0"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-[var(--color-pop-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden z-50 origin-top-right transition-all duration-300`}
                >
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                    <h3 className="font-bold text-black text-sm flex items-center gap-2">
                      การแจ้งเตือน
                      {unreadCount > 0 && (
                        <span className="bg-[var(--color-pop-red)]/10 text-[var(--color-pop-red)] px-2 py-0.5 rounded-full text-xs font-bold">
                          {unreadCount} ใหม่
                        </span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-[var(--color-pop-red)] font-semibold hover:underline"
                      >
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  
                  <div className={`overflow-y-auto transition-all duration-300 ${viewAll ? 'max-h-[60vh] sm:max-h-[500px]' : 'max-h-[400px]'}`}>
                    {displayNotifications.map((notif) => {
                      const style = getNotificationStyle(notif.type);
                      const targetUrl = resolveNotificationUrl(notif);
                      return (
                        <Link 
                          key={notif.id} 
                          href={targetUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            markAsRead(notif);
                          }}
                          className={`flex gap-3 p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 ${!notif.isRead ? 'bg-[var(--color-pop-red)]/5' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.color}`}>
                            {style.icon}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className={`text-sm truncate ${!notif.isRead ? 'font-bold text-black' : 'font-medium text-neutral-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-neutral-500 text-xs line-clamp-2 mt-0.5">{notif.message}</p>
                            <p className="text-neutral-400 text-[10px] mt-1.5">{new Date(notif.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[var(--color-pop-red)] mt-1.5 shrink-0"></div>
                        )}
                      </Link>
                      );
                    })}
                    {displayNotifications.length === 0 && (
                      <div className="p-8 text-center text-neutral-500 text-sm">
                        ไม่มีการแจ้งเตือน
                      </div>
                    )}
                  </div>

                  {!viewAll && notifications.length > 3 && (
                    <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-center">
                      <button 
                        onClick={() => setViewAll(true)} 
                        className="text-xs font-semibold text-black hover:underline w-full py-1"
                      >
                        ดูการแจ้งเตือนทั้งหมด
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile / Sign In */}
          {status === "loading" ? (
            <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse shrink-0" />
          ) : session ? (
            <Link 
              href="/profile" 
              className="w-10 h-10 rounded-full bg-black hover:bg-neutral-800 flex items-center justify-center text-white transition-all active:scale-95 shrink-0 shadow-sm overflow-hidden"
              title={session.user?.name || "Profile"}
            >
              {session.user?.image ? (
                <img src={session.user.image} alt={session.user?.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </Link>
          ) : (
            <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-all active:scale-95 shrink-0 shadow-sm">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex flex-col space-y-1.5 z-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={28} className="text-black" />
          ) : (
            <>
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-4 h-0.5 bg-black"></div>
            </>
          )}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center pt-20"
          >
            <div className="flex flex-col items-center gap-6 w-full px-6 max-w-sm">
              {/* Mobile Search Bar Removed */}

              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      className={`font-sans text-3xl sm:text-4xl lowercase font-bold ${isActive ? "text-[var(--color-pop-red)]" : "text-black"
                        }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                className="mt-6 flex items-center justify-center gap-4 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: navLinks.length * 0.05 + 0.1, duration: 0.3 }}
              >
                <div className="relative">
                  <button 
                    onClick={() => {
                      setMenuOpen(false);
                      setNotificationsOpen(true);
                    }} 
                    className="relative w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-black"
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 min-w-4 h-4 px-1 bg-[var(--color-pop-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                {status === "loading" ? (
                  <div className="w-12 h-12 rounded-full bg-neutral-200 animate-pulse shrink-0" />
                ) : session ? (
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-black overflow-hidden">
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user?.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} />
                    )}
                  </Link>
                ) : (
                  <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} onClick={() => setMenuOpen(false)} className="px-6 py-3 rounded-full bg-black text-white font-semibold">
                    Sign In
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


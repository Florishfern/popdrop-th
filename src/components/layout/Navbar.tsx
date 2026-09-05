"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, User, Search, Bell, CheckCircle, Package, Gavel } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

const navLinks = [
  { name: "home", href: "/" },
  { name: "market", href: "/market" },
  { name: "seller", href: "/seller" },
];

const initialNotifications = [
  {
    id: 1,
    title: "คุณชนะการประมูล!",
    description: "POP MART LABUBU The Monsters Exciting Macaron",
    time: "2 นาทีที่แล้ว",
    icon: <Gavel size={20} className="text-white" />,
    color: "bg-purple-500",
    href: "/profile",
    read: false,
  },
  {
    id: 2,
    title: "ชำระเงินสำเร็จ",
    description: "คำสั่งซื้อ #123456 ได้รับการชำระเงินแล้ว",
    time: "1 ชั่วโมงที่แล้ว",
    icon: <CheckCircle size={20} className="text-white" />,
    color: "bg-green-500",
    href: "/profile",
    read: false,
  },
  {
    id: 3,
    title: "สินค้ากำลังจัดส่ง",
    description: "CRYBABY x Powerpuff Girls Series Figures",
    time: "3 ชั่วโมงที่แล้ว",
    icon: <Package size={20} className="text-white" />,
    color: "bg-blue-500",
    href: "/profile",
    read: true,
  },
  {
    id: 4,
    title: "มีผู้เสนอราคาสูงกว่าคุณ",
    description: "Hirono V1 Series",
    time: "5 ชั่วโมงที่แล้ว",
    icon: <Gavel size={20} className="text-white" />,
    color: "bg-orange-500",
    href: "/profile",
    read: true,
  },
  {
    id: 5,
    title: "รายการสินค้าของคุณถูกขายแล้ว",
    description: "Skullpanda City of Night",
    time: "1 วันที่แล้ว",
    icon: <CheckCircle size={20} className="text-white" />,
    color: "bg-green-500",
    href: "/profile",
    read: true,
  },
  {
    id: 6,
    title: "จัดส่งสินค้าสำเร็จ",
    description: "Molly Space 100%",
    time: "2 วันที่แล้ว",
    icon: <Package size={20} className="text-white" />,
    color: "bg-blue-500",
    href: "/profile",
    read: true,
  },
  {
    id: 7,
    title: "คุณชนะการประมูล!",
    description: "Dimoo Jurassic World",
    time: "3 วันที่แล้ว",
    icon: <Gavel size={20} className="text-white" />,
    color: "bg-purple-500",
    href: "/profile",
    read: true,
  },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const pathname = usePathname();
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setViewAll(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleNotifications = () => {
    if (notificationsOpen) {
      setViewAll(false);
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const displayNotifications = viewAll ? notifications : notifications.slice(0, 3);

  return (
    <>
      <nav className="w-full px-6 sm:px-10 lg:px-16 py-6 lg:py-8 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 z-50 shrink-0">
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
          {/* Search Bar */}
          <div className="flex items-center gap-2.5 bg-white border-2 border-neutral-300 shadow-sm px-4 py-2 rounded-full text-xs text-black w-48 lg:w-60 focus-within:w-72 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 transition-all">
            <Search size={18} className="text-black shrink-0" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="bg-transparent border-none outline-none w-full text-xs font-medium text-black placeholder:text-neutral-500"
            />
          </div>

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
                    {displayNotifications.map((notif) => (
                      <Link 
                        key={notif.id} 
                        href={notif.href}
                        onClick={() => {
                          markAsRead(notif.id);
                          setNotificationsOpen(false);
                          setViewAll(false);
                        }}
                        className={`flex gap-3 p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 ${!notif.read ? 'bg-[var(--color-pop-red)]/5' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                          {notif.icon}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className={`text-sm truncate ${!notif.read ? 'font-bold text-black' : 'font-medium text-neutral-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-neutral-500 text-xs line-clamp-2 mt-0.5">{notif.description}</p>
                          <p className="text-neutral-400 text-[10px] mt-1.5">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-[var(--color-pop-red)] mt-1.5 shrink-0"></div>
                        )}
                      </Link>
                    ))}
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
          {session ? (
            <Link href="/profile" className="w-10 h-10 rounded-full bg-black hover:bg-neutral-800 flex items-center justify-center text-white transition-all active:scale-95 shrink-0 shadow-sm">
              <User size={18} />
            </Link>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-all active:scale-95 shrink-0 shadow-sm">
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
              {/* Mobile Search Bar */}
              <div className="flex items-center gap-2.5 bg-white border-2 border-neutral-300 shadow-sm px-4 py-3 rounded-full text-sm text-black w-full mb-2 focus-within:border-black">
                <Search size={18} className="text-black shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-black placeholder:text-neutral-500"
                />
              </div>

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
                {session ? (
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-black">
                    <User size={24} />
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="px-6 py-3 rounded-full bg-black text-white font-semibold">
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


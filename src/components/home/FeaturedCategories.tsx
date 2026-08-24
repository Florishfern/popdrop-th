"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  {
    id: "art-toy",
    name: "ART TOY",
    title: "Hirono Series",
    description: "Discover the emotional and expressive world of Hirono art toys. Each piece tells a unique story of childhood memories and inner feelings, crafted with exquisite detail.",
    image: "/images/hirono.png",
    color: "#ff8b94", // Soft red/pink circle background to match popdrop style
    scale: "scale-[1.35] sm:scale-[1.5]",
  },
  {
    id: "trading-card",
    name: "TRADING CARD",
    title: "Pokemon TCG",
    description: "Collect, trade, and battle with rare holographic Pokémon cards. Featuring iconic characters, stunning artwork, and competitive gameplay mechanics.",
    image: "/images/pokemon.png",
    color: "#facc15", // Yellow circle background
    scale: "scale-[0.65] sm:scale-[0.7]",
  },
  {
    id: "model",
    name: "MODEL",
    title: "Gundam Custom",
    description: "Build and customize highly detailed mecha models. Experience the thrill of assembling intricate parts to create your ultimate robotic masterpiece.",
    image: "/images/gundum.png",
    color: "#60a5fa", // Blue circle background
    scale: "scale-[1.35] sm:scale-[1.5]",
  }
];

const stageVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.85,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 },
      scale: { duration: 0.3 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 120 : -120,
    opacity: 0,
    scale: 0.85,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
    },
  }),
};

export default function FeaturedCategories() {
  const [[currentIndex, direction], setPage] = useState([0, 0]);
  const sectionRef = useRef<HTMLElement>(null);
  const isCooldownRef = useRef(false);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const paginate = (newDirection: number) => {
    let nextIndex = currentIndex + newDirection;
    if (nextIndex >= categories.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = categories.length - 1;
    setPage([nextIndex, newDirection]);
  };

  const handleNext = () => paginate(1);
  const handlePrev = () => paginate(-1);

  const handleSelect = (idx: number) => {
    if (idx === currentIndex) return;
    const dir = idx > currentIndex ? 1 : -1;
    setPage([idx, dir]);
  };

  // Native Wheel Event Listener with { passive: false } to prevent browser back/forward history swipe
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;

      if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();

        if (!isCooldownRef.current) {
          if (deltaX > 0) {
            const nextIdx = (currentIndexRef.current + 1) % categories.length;
            setPage([nextIdx, 1]);
          } else {
            const prevIdx = (currentIndexRef.current - 1 + categories.length) % categories.length;
            setPage([prevIdx, -1]);
          }
          isCooldownRef.current = true;
          setTimeout(() => {
            isCooldownRef.current = false;
          }, 450);
        }
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const currentCategory = categories[currentIndex];

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-[#F4F4F6] py-16 sm:py-24 overflow-hidden relative select-none"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center">
        
        {/* Header with Nav */}
        <div className="w-full flex items-center justify-between mb-8 sm:mb-12 z-10">
          <button onClick={handlePrev} className="flex items-center gap-2 text-neutral-500 hover:text-[var(--color-pop-red)] transition-colors font-bold text-xs sm:text-sm tracking-wider uppercase">
            <ChevronLeft size={18} /> <span className="hidden sm:inline">PREV</span>
          </button>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-sans text-black tracking-tight uppercase text-center">
            Categories
          </h2>
          <button onClick={handleNext} className="flex items-center gap-2 text-neutral-500 hover:text-[var(--color-pop-red)] transition-colors font-bold text-xs sm:text-sm tracking-wider uppercase">
            <span className="hidden sm:inline">NEXT</span> <ChevronRight size={18} />
          </button>
        </div>

        {/* Center Stage Layout */}
        <div className="relative w-full flex flex-col lg:flex-row items-center justify-between min-h-[500px] mb-12 sm:mb-16 z-10">
          
          {/* Left Text */}
          <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left mb-12 lg:mb-0 z-20">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={`title-${currentIndex}`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction < 0 ? 30 : -30 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--color-pop-red)] drop-shadow-sm mb-2 uppercase">
                  {currentCategory.name}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-neutral-500 tracking-widest uppercase">
                  TITLE: {currentCategory.title}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Center Stage: Circle + Pop-out Character Grouped Together */}
          <div className="w-full lg:w-1/3 flex justify-center items-center relative min-h-[350px] sm:min-h-[500px] z-10 overflow-visible">
            
            {/* Dashed Outline Ring */}
            <div className="absolute inset-0 m-auto w-[270px] h-[270px] sm:w-[400px] sm:h-[400px] rounded-full border-2 border-dashed border-neutral-300 animate-[spin_20s_linear_infinite] pointer-events-none" />

            {/* Synchronized Grouped Animation (Circle + Image) */}
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={`stage-${currentIndex}`}
                custom={direction}
                variants={stageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  const swipeThreshold = 50;
                  if (info.offset.x < -swipeThreshold) {
                    handleNext();
                  } else if (info.offset.x > swipeThreshold) {
                    handlePrev();
                  }
                }}
                className="relative flex items-center justify-center cursor-grab active:cursor-grabbing w-[300px] h-[400px] sm:w-[450px] sm:h-[550px] z-30"
              >
                {/* Background Circle */}
                <div 
                  className="absolute inset-0 m-auto w-[240px] h-[240px] sm:w-[350px] sm:h-[350px] rounded-full blur-[2px] pointer-events-none"
                  style={{ backgroundColor: currentCategory.color }}
                />

                {/* Pop-out 3D Character Image */}
                <div className="relative w-full h-full drop-shadow-2xl pointer-events-none">
                  <Image 
                    src={currentCategory.image} 
                    alt={currentCategory.name} 
                    fill 
                    draggable={false}
                    className={`object-contain transform transition-transform duration-500 pointer-events-none ${currentCategory.scale}`}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Text */}
          <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-end text-center lg:text-right mt-12 lg:mt-0 z-20">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={`desc-${currentIndex}`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction < 0 ? 30 : -30 }}
                transition={{ duration: 0.3 }}
                className="max-w-xs"
              >
                <p className="text-neutral-700 text-sm sm:text-base leading-relaxed font-medium">
                  {currentCategory.description}
                </p>
                <button className="mt-4 text-[var(--color-pop-red)] font-bold text-sm hover:underline uppercase tracking-wider">
                  View Collection
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Thumbnail Selector */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 z-20">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(idx)}
              className={`flex flex-col items-center gap-3 transition-all duration-300 ${
                currentIndex === idx ? "scale-110 opacity-100" : "scale-100 opacity-50 hover:opacity-80"
              }`}
            >
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2 border-2 ${
                currentIndex === idx ? "border-[var(--color-pop-red)]" : "border-transparent"
              }`}>
                <div className="relative w-full h-full">
                  <Image src={cat.image} alt={cat.name} fill className="object-contain drop-shadow-md" />
                </div>
              </div>
              <span className="font-bold text-black text-xs sm:text-sm uppercase tracking-wide">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Bottom indicator dots */}
        <div className="flex items-center gap-2 mt-10 z-20">
          {categories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx ? "bg-[var(--color-pop-red)] w-8" : "bg-neutral-300 hover:bg-neutral-400 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 pt-4 pb-4 lg:pb-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
      {/* Left Column: Text & CTA */}
      <div className="w-full lg:w-1/2 flex flex-col items-start z-10">
        
        {/* Content */}
        <h1 className="animate-fade-up-delay-1 font-sans font-bold lowercase leading-[1.05] tracking-tight text-black text-[clamp(2.5rem,6vw,5rem)]">
          never miss a<br />rare drop
        </h1>

        <p className="animate-fade-up-delay-2 text-neutral-500 text-sm sm:text-base font-sans leading-relaxed max-w-md lowercase mt-4 sm:mt-6">
          discover limited-edition art toys, trading cards, and exclusive collectibles.
        </p>

        <div className="animate-fade-up-delay-3 mt-8 sm:mt-10">
          <Link href="/signup" className="inline-block bg-[var(--color-pop-red)] hover:bg-[var(--color-pop-red-hover)] text-white px-12 sm:px-16 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold tracking-wider lowercase transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30">
            sign up
          </Link>
        </div>
      </div>

      {/* Right Column: 3D Image Cards Row */}
      <div className="w-full lg:w-1/2 flex justify-center items-center relative z-0 mt-8 lg:mt-0 min-h-[420px] sm:min-h-[520px] lg:min-h-[580px]">
        <div className="relative w-full max-w-[750px] h-[380px] sm:h-[480px] lg:h-[540px] flex justify-center items-center">
          
          {/* 1. Left Card: Mickey */}
          <motion.div 
            animate={{ y: [0, -24, 0], rotate: [-6, -10, -6] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            className="absolute z-10 hover:z-50 transition-all duration-300 -translate-x-24 sm:-translate-x-36 lg:-translate-x-44"
          >
            <div className="relative w-[160px] sm:w-[250px] lg:w-[300px] aspect-[3/4] hover:rotate-0 hover:scale-110 transition-all duration-300 cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-black/10">
              <Image src="/images/mickey_card.avif" alt="Mickey Card" fill className="object-cover" />
            </div>
          </motion.div>

          {/* 2. Middle Card: Buzz */}
          <motion.div 
            animate={{ y: [0, -32, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute z-20 hover:z-50 transition-all duration-300 translate-x-0"
          >
            <div className="relative w-[160px] sm:w-[250px] lg:w-[300px] aspect-[3/4] hover:scale-110 transition-all duration-300 cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-black/10">
              <Image src="/images/buzz.avif" alt="Buzz Model" fill className="object-cover" priority />
            </div>
          </motion.div>

          {/* 3. Right Card: Elsa */}
          <motion.div 
            animate={{ y: [0, -26, 0], rotate: [6, 10, 6] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="absolute z-30 hover:z-50 transition-all duration-300 translate-x-24 sm:translate-x-36 lg:translate-x-44"
          >
            <div className="relative w-[160px] sm:w-[250px] lg:w-[300px] aspect-[3/4] hover:rotate-0 hover:scale-110 transition-all duration-300 cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-black/10">
              <Image src="/images/elsa.avif" alt="Elsa Art Toy" fill className="object-cover" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

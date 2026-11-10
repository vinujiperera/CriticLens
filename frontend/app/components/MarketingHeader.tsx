"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";

export function MarketingHeader() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-0 left-0 right-0 z-50 border-b border-sunrise-burgundy/10 bg-white/80 backdrop-blur-md shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex h-16 sm:h-[4.25rem] items-center justify-between gap-6">
        <BrandLogo
          href="/"
          variant="header"
          priority
          imageClassName="h-10 sm:h-11 w-auto max-w-[min(100%,260px)]"
        />

        <Link
          href="/movies"
          className="inline-flex items-center justify-center rounded-xl bg-sunrise-coral px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e85f5b] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shrink-0"
        >
          Browse movies
        </Link>
      </div>
    </motion.header>
  );
}

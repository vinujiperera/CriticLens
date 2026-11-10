"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";

const links = [
  { href: "/movies", label: "Movies", key: "movies" as const },
  { href: "/movies/compare", label: "Compare", key: "compare" as const },
  { href: "/dashboard", label: "Lab", key: "lab" as const },
];

function resolveActive(pathname: string) {
  if (pathname.startsWith("/movies/compare")) return "compare";
  if (pathname.startsWith("/movies")) return "movies";
  if (pathname.startsWith("/dashboard")) return "lab";
  return null;
}

function NavLink({
  href,
  label,
  active,
  layoutId,
}: {
  href: string;
  label: string;
  active: boolean;
  layoutId: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Link
      href={href}
      className={`relative px-2.5 sm:px-3 py-2 text-sm rounded-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${
        active
          ? "text-sunrise-coral font-semibold"
          : "text-sunrise-burgundy/70 hover:text-sunrise-burgundy hover:bg-sunrise-peach/40"
      }`}
    >
      {active && !reduceMotion && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-sunrise-coral/15 ring-1 ring-sunrise-coral/25"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      {active && reduceMotion && (
        <span className="absolute inset-0 rounded-lg bg-sunrise-coral/15 ring-1 ring-sunrise-coral/25" />
      )}
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export function PlatformHeader() {
  const pathname = usePathname();
  const active = resolveActive(pathname);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-sunrise-burgundy/10 bg-sunrise-surface/95 backdrop-blur-md shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <BrandLogo
            href="/"
            variant="header"
            imageClassName="h-10 sm:h-11 w-auto max-w-[min(100%,260px)]"
          />

          <nav className="flex items-center gap-1" aria-label="Platform">
            <Link
              href="/"
              className="px-2.5 sm:px-3 py-2 text-sm text-sunrise-burgundy/70 hover:text-sunrise-burgundy rounded-lg hover:bg-sunrise-peach/50 transition-all duration-300"
            >
              Home
            </Link>
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={active === link.key}
                layoutId="platform-nav-active"
              />
            ))}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}

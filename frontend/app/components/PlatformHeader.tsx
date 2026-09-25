"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function PlatformHeader() {
  const pathname = usePathname();
  const active = resolveActive(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-sunrise-burgundy/10 bg-sunrise-surface/95 backdrop-blur-md shadow-sm">
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
              className="px-2.5 sm:px-3 py-2 text-sm text-sunrise-burgundy/70 hover:text-sunrise-burgundy rounded-lg hover:bg-sunrise-peach/50 transition"
            >
              Home
            </Link>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 sm:px-3 py-2 text-sm rounded-lg transition ${
                  active === link.key
                    ? "bg-sunrise-coral/15 text-sunrise-coral font-medium"
                    : "text-sunrise-burgundy/70 hover:text-sunrise-burgundy hover:bg-sunrise-peach/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

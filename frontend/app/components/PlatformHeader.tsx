import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

const links = [
  { href: "/movies", label: "Movies" },
  { href: "/movies/compare", label: "Compare" },
  { href: "/dashboard", label: "Lab" },
] as const;

export function PlatformHeader({ active }: { active?: "movies" | "compare" | "lab" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-sunrise-burgundy/10 bg-sunrise-surface/95 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <BrandLogo href="/" variant="header" />

          <nav className="hidden sm:flex items-center gap-1" aria-label="Platform">
            <Link
              href="/"
              className="px-3 py-2 text-sm text-sunrise-burgundy/70 hover:text-sunrise-burgundy rounded-lg hover:bg-sunrise-peach/50 transition"
            >
              Home
            </Link>
            {links.map((link) => {
              const isActive =
                (active === "movies" && link.href === "/movies") ||
                (active === "compare" && link.href === "/movies/compare") ||
                (active === "lab" && link.href === "/dashboard");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    isActive
                      ? "bg-sunrise-coral/15 text-sunrise-coral font-medium"
                      : "text-sunrise-burgundy/70 hover:text-sunrise-burgundy hover:bg-sunrise-peach/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/movies"
            className="inline-flex items-center justify-center rounded-xl bg-sunrise-coral px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f5b] transition shrink-0"
          >
            Browse movies
          </Link>
        </div>
      </div>
    </header>
  );
}

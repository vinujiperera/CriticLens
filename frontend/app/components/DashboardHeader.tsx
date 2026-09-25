import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

const links = [
  { href: "/dashboard#analyze", label: "Analyze" },
  { href: "/dashboard#history", label: "History" },
] as const;

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-sunrise-burgundy/10 bg-sunrise-surface/95 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BrandLogo href="/" variant="header" />
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest text-sunrise-burgundy/45 border-l border-sunrise-burgundy/15 pl-4">
              Dashboard
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Dashboard">
            <Link
              href="/"
              className="px-3 py-2 text-sm text-sunrise-burgundy/70 hover:text-sunrise-burgundy rounded-lg hover:bg-sunrise-peach/50 transition"
            >
              Home
            </Link>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-sunrise-burgundy/70 hover:text-sunrise-burgundy rounded-lg hover:bg-sunrise-peach/50 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link
            href="/dashboard#analyze"
            className="inline-flex items-center justify-center rounded-xl bg-sunrise-coral px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f5b] transition shrink-0"
          >
            New analysis
          </Link>
        </div>
      </div>
    </header>
  );
}

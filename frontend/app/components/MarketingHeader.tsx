import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function MarketingHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-12 pt-4 sm:pt-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <BrandLogo href="/" variant="header" priority />

        <div className="flex items-center gap-2">
          <Link
            href="/movies"
            className="hidden sm:inline-flex text-sm text-white/85 hover:text-white px-3 py-2"
          >
            Browse movies
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-sunrise-coral px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 hover:bg-[#e85f5b] transition"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

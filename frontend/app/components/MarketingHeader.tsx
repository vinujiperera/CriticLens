import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function MarketingHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 border-b border-sunrise-burgundy/10 bg-white/75 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex h-16 sm:h-[4.25rem] items-center justify-between gap-6">
        <BrandLogo
          href="/"
          variant="header"
          priority
          imageClassName="h-10 sm:h-11 w-auto max-w-[min(100%,260px)]"
        />

        <Link
          href="/movies"
          className="inline-flex items-center justify-center rounded-xl bg-sunrise-coral px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#e85f5b] transition shrink-0"
        >
          Browse movies
        </Link>
      </div>
    </header>
  );
}

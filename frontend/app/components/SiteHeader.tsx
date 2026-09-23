import { BrandLogo } from "./BrandLogo";

const navLinks = [
  { href: "#analyze", label: "Analyze" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#history", label: "History" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-sunrise-burgundy/95 backdrop-blur-md shadow-lg shadow-sunrise-burgundy/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.25rem] sm:h-[4.5rem] items-center justify-between gap-4">
          <BrandLogo variant="header" priority />

          <nav className="hidden sm:flex items-center gap-1" aria-label="Main">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-sunrise-cream/85 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#analyze"
            className="inline-flex items-center justify-center rounded-xl bg-sunrise-coral px-4 py-2 text-sm font-semibold text-white shadow-md shadow-black/20 hover:bg-[#e85f5b] transition shrink-0"
          >
            Get started
          </a>
        </div>

        <nav
          className="flex sm:hidden gap-1.5 pb-3 overflow-x-auto -mx-1 px-1"
          aria-label="Main mobile"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-xs font-medium text-sunrise-cream whitespace-nowrap rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

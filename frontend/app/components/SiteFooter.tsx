import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-sunrise-burgundy text-sunrise-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <BrandLogo href="/" variant="footer" />
            <p className="text-sm text-sunrise-cream/80 leading-relaxed max-w-sm">
              Sentiment analysis for film, book, and media reviews—powered by a scikit-learn TF-IDF
              pipeline and served through FastAPI.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white uppercase tracking-wide">Explore</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/movies" className="text-sunrise-cream/80 hover:text-sunrise-coral transition">
                  Browse movies
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sunrise-cream/80 hover:text-sunrise-coral transition">
                  Analytics lab
                </Link>
              </li>
              <li>
                <Link href="/dashboard#analyze" className="text-sunrise-cream/80 hover:text-sunrise-coral transition">
                  Analyze a review
                </Link>
              </li>
              <li>
                <Link href="/dashboard#history" className="text-sunrise-cream/80 hover:text-sunrise-coral transition">
                  Recent history
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold text-white uppercase tracking-wide">Features</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/movies/compare"
                  className="text-sunrise-cream/80 hover:text-sunrise-coral transition"
                >
                  Compare audience sentiment
                </Link>
              </li>
              <li>
                <Link href="/movies" className="text-sunrise-cream/80 hover:text-sunrise-coral transition">
                  Browse by genre
                </Link>
              </li>
              <li className="text-sunrise-cream/80">Aspect scores & review breakdowns</li>
              <li className="text-sunrise-cream/80">Exportable film & review PDF reports</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sunrise-cream/55">
          <p>© {year} CriticLens. Built for critique sentiment exploration.</p>
          <Link href="/" className="hover:text-sunrise-coral transition">
            Back to top
          </Link>
        </div>
      </div>
    </footer>
  );
}

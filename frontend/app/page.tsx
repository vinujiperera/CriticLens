import Link from "next/link";
import { ChevronRight, Film, LineChart, Sparkles } from "lucide-react";
import { MarketingHeader } from "./components/MarketingHeader";
import { PosterBackdrop } from "./components/PosterBackdrop";
import { SiteFooter } from "./components/SiteFooter";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MarketingHeader />

      <section className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-28 sm:px-6 sm:pt-32 min-h-[88vh]">
        <PosterBackdrop />

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-sunrise-coral" />
            No sign-in · Instant ML sentiment insights
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] drop-shadow-lg">
            Critique intelligence
            <br />
            <span className="text-sunrise-coral">for every moment</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto font-medium">
            Decode film, book, and media reviews with aspect polarity, narrative trajectory, and
            token-level explainability.
          </p>

          <p className="text-sm sm:text-base text-white/65 max-w-xl mx-auto">
            Ready to analyze? Jump straight into the dashboard—paste a critique and get sentiment
            breakdowns in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-2xl mx-auto pt-2">
            <Link
              href="/movies"
              className="flex-1 rounded-md border border-white/25 bg-black/40 backdrop-blur-sm px-4 py-3.5 text-center sm:text-left text-sm text-white/80 hover:bg-black/50 transition"
            >
              Browse movies & read reviews →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sunrise-coral to-[#e85f5b] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-sunrise-coral/25 hover:opacity-95 transition whitespace-nowrap"
            >
              Get started
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-16 sm:mt-20 w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
          {[
            {
              icon: Film,
              title: "Aspect breakdown",
              desc: "Acting, story, visuals, and pacing meters",
            },
            {
              icon: LineChart,
              title: "Sentence trajectory",
              desc: "See how tone shifts across the critique",
            },
            {
              icon: Sparkles,
              title: "XAI token audit",
              desc: "Hover words to inspect model weights",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 text-left"
            >
              <item.icon className="h-5 w-5 text-sunrise-coral mb-3" />
              <h2 className="text-sm font-semibold text-white">{item.title}</h2>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-10 border-t border-white/10">
        <SiteFooter />
      </div>
    </div>
  );
}

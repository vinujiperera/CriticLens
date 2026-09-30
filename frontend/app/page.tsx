import Link from "next/link";
import { ChevronRight, Film, LineChart, Sparkles } from "lucide-react";
import { MarketingHeader } from "./components/MarketingHeader";
import { PosterBackdrop } from "./components/PosterBackdrop";
import { SiteFooter } from "./components/SiteFooter";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#ffe8e3] to-[#fff5f2] text-sunrise-burgundy">
      <MarketingHeader />

      <section className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-24 sm:px-6 sm:pt-28 min-h-[88vh]">
        <PosterBackdrop />

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-sunrise-burgundy/15 bg-white/70 px-3 py-1 text-xs font-medium text-sunrise-burgundy/80 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-sunrise-coral" />
            No sign-in · Instant ML sentiment insights
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-sunrise-burgundy">
            Critique intelligence
            <br />
            <span className="text-sunrise-coral">for every moment</span>
          </h1>

          <p className="text-lg sm:text-xl text-sunrise-burgundy/85 max-w-2xl mx-auto font-medium">
            Explore reviews. Reveal the sentiment.
          </p>

          <p className="text-sm sm:text-base text-sunrise-burgundy/65 max-w-xl mx-auto">
            Ready to analyze? Jump into the lab—paste a critique and get sentiment breakdowns in
            seconds.
          </p>

          <div className="flex justify-center pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sunrise-coral to-[#e85f5b] px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-sunrise-coral/20 hover:opacity-95 transition"
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
              title: "Scores by topic",
              desc: "Acting, story, visuals, and pacing at a glance",
            },
            {
              icon: LineChart,
              title: "Mood over time",
              desc: "See how tone shifts from sentence to sentence",
            },
            {
              icon: Sparkles,
              title: "Important words",
              desc: "Discover which words pushed the rating up or down",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-sunrise-burgundy/10 bg-white/75 backdrop-blur-sm p-5 text-left shadow-sm"
            >
              <item.icon className="h-5 w-5 text-sunrise-coral mb-3" />
              <h2 className="text-sm font-semibold text-sunrise-burgundy">{item.title}</h2>
              <p className="text-xs text-sunrise-burgundy/60 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-10 border-t border-sunrise-burgundy/10">
        <SiteFooter />
      </div>
    </div>
  );
}

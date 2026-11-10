import { MarketingHeader } from "./components/MarketingHeader";
import { HomeHero } from "./components/HomeHero";
import { PosterBackdrop } from "./components/PosterBackdrop";
import { SiteFooter } from "./components/SiteFooter";

export default function HomePage() {
  return (
    <div className="home-page-shell relative flex min-h-screen flex-col text-sunrise-burgundy">
      <div className="fixed inset-0 z-0">
        <PosterBackdrop />
      </div>
      <MarketingHeader />
      <HomeHero />
      <div className="relative z-10 border-t border-sunrise-burgundy/10">
        <SiteFooter />
      </div>
    </div>
  );
}

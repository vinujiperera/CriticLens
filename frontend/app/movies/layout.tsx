import { PlatformHeader } from "../components/PlatformHeader";

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-sunrise-cream text-sunrise-burgundy">
      <PlatformHeader />
      {children}
    </div>
  );
}

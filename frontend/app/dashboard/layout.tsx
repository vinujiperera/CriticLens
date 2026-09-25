import { PlatformHeader } from "../components/PlatformHeader";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-sunrise-cream text-sunrise-burgundy">
      <PlatformHeader active="lab" />
      {children}
    </div>
  );
}

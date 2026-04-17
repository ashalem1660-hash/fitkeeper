import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      <div className="max-w-lg mx-auto">{children}</div>
      <BottomNav />
    </div>
  );
}

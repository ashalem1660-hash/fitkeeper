"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Apple, Target } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/dashboard", label: "בית", icon: Home },
  { href: "/gym", label: "אימונים", icon: Dumbbell },
  { href: "/nutrition", label: "תזונה", icon: Apple },
  { href: "/goals", label: "יעדים", icon: Target },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <ul className="max-w-lg mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = path === t.href || (t.href !== "/dashboard" && path.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
                  active ? "text-accent" : "text-muted hover:text-fg"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
                <span className="font-medium">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

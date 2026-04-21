"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="התנתקות"
            className="w-9 h-9 rounded-xl bg-surface-2 hover:bg-border flex items-center justify-center transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}

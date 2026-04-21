import Link from "next/link";
import { signup } from "../actions";
import { Dumbbell } from "lucide-react";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-10 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-glow">
          <Dumbbell className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-none">
            FitKeeper
          </h1>
          <p className="text-muted text-sm mt-1">התחל את המסע שלך</p>
        </div>
      </div>

      <div className="card p-6 animate-fade-in">
        <h2 className="font-display text-2xl font-bold mb-1">הרשמה</h2>
        <p className="text-muted text-sm mb-6">30 שניות וצועדים קדימה</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        <form action={signup} className="space-y-4">
          <div>
            <label className="label" htmlFor="full_name">
              שם מלא
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="input"
              placeholder="ישראל ישראלי"
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              dir="ltr"
              className="input text-right"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              סיסמה (מינימום 6 תווים)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              dir="ltr"
              className="input text-right"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            יצירת חשבון
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          כבר רשום?{" "}
          <Link href="/auth/login" className="text-accent font-medium">
            כניסה
          </Link>
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { signup } from "../actions";
import { Compass, ShieldCheck } from "lucide-react";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_430px]">
        <section className="hidden rounded-3xl bg-gradient-to-br from-blue-700 to-emerald-500 p-10 text-white shadow-xl lg:block">
          <div className="mb-12 flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3"><Compass /></div>
            <div><p className="text-xs font-bold tracking-[0.2em] text-blue-100">DRONEOPS</p><h1 className="text-2xl font-extrabold">Field Operations Workspace</h1></div>
          </div>
          <h2 className="max-w-md text-3xl font-extrabold leading-tight">התחלה מהירה לצוות השטח שלך.</h2>
          <p className="mt-6 flex items-center gap-2 text-blue-50"><ShieldCheck className="h-5 w-5" /> חשבון מורשה לשמירה מאובטחת של נתונים ותמונות</p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 p-3 text-white"><Compass /></div>
            <div><p className="text-xs font-bold tracking-[0.18em] text-blue-600">DRONEOPS</p><h1 className="font-extrabold">מערכת תפעול שטח</h1></div>
          </div>
          <h2 className="text-2xl font-extrabold">יצירת משתמש Pilot</h2>
          <p className="mt-2 text-sm text-slate-500">עובד מחובר יכול לעדכן ביקורים ולשמור תיעוד שטח.</p>
          {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <form action={signup} className="mt-7 space-y-4">
            <div><label className="label" htmlFor="full_name">שם מלא</label><input id="full_name" name="full_name" type="text" required className="input" placeholder="יניב שלם" /></div>
            <div><label className="label" htmlFor="email">אימייל</label><input id="email" name="email" type="email" required dir="ltr" className="input text-right" placeholder="you@company.com" /></div>
            <div><label className="label" htmlFor="password">סיסמה</label><input id="password" name="password" type="password" required minLength={6} dir="ltr" className="input text-right" placeholder="לפחות 6 תווים" /></div>
            <button type="submit" className="btn-primary w-full py-3">צור חשבון והמשך</button>
          </form>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-sm"><Link href="/droneops" className="font-bold text-blue-700">חזרה לדמו</Link><Link href="/auth/login" className="font-bold text-blue-700">יש לי חשבון</Link></div>
        </section>
      </div>
    </main>
  );
}

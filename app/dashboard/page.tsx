import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { toISODate, hebrewFormat, subDays } from "@/lib/utils/date";
import { Flame, Droplet, Dumbbell, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { MotivationCard } from "@/components/shared/motivation-card";
import { QuickWeightLog } from "@/components/shared/quick-weight-log";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const today = toISODate(new Date());

  const [{ data: profile }, { data: todayWorkout }, { data: todayMeals }, { data: todayWater }, { data: weekWorkouts }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("workouts")
        .select("id, muscle_group, name")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("meals")
        .select("calories, protein, carbs, fat")
        .eq("user_id", user.id)
        .eq("date", today),
      supabase
        .from("water_log")
        .select("amount_ml")
        .eq("user_id", user.id)
        .eq("date", today),
      supabase
        .from("workouts")
        .select("date, muscle_group")
        .eq("user_id", user.id)
        .gte("date", toISODate(subDays(new Date(), 6))),
    ]);

  const totals = (todayMeals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const waterMl = (todayWater ?? []).reduce((a, w) => a + w.amount_ml, 0);
  const profileNeedsSetup = !profile?.calorie_target;

  return (
    <AppShell>
      <TopBar
        title={`שלום${profile?.full_name ? `, ${profile.full_name}` : ""} 👋`}
        subtitle={hebrewFormat(new Date())}
      />

      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {profileNeedsSetup && (
          <Link href="/goals" className="block card p-4 border-accent/40 bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">הגדר את היעדים שלך</div>
                <div className="text-xs text-muted">חשב קלוריות, חלבון ומים באופן אישי</div>
              </div>
            </div>
          </Link>
        )}

        <section className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Dumbbell className="w-4 h-4" />}
            label="אימון היום"
            value={todayWorkout?.muscle_group ? muscleToHebrew(todayWorkout.muscle_group) : "—"}
            href="/gym"
          />
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            label="קלוריות"
            value={`${Math.round(totals.calories)}${profile?.calorie_target ? ` / ${profile.calorie_target}` : ""}`}
            href="/nutrition"
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="חלבון (ג')"
            value={`${Math.round(totals.protein)}${profile?.protein_target ? ` / ${profile.protein_target}` : ""}`}
            href="/nutrition"
          />
          <StatCard
            icon={<Droplet className="w-4 h-4" />}
            label="מים (מ״ל)"
            value={`${waterMl}${profile?.water_target_ml ? ` / ${profile.water_target_ml}` : ""}`}
            href="/nutrition"
          />
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">7 הימים האחרונים</h2>
            <span className="text-xs text-muted">{(weekWorkouts ?? []).length} אימונים</span>
          </div>
          <WeekStrip workouts={weekWorkouts ?? []} />
        </section>

        <MotivationCard userName={profile?.full_name ?? undefined} />

        <QuickWeightLog />

        <Link href="/gym" className="btn-primary w-full">
          <Sparkles className="w-4 h-4" />
          התחל אימון עכשיו
        </Link>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="card p-4 hover:border-accent/40 transition">
      <div className="flex items-center gap-2 text-muted text-xs mb-1.5">
        {icon} {label}
      </div>
      <div className="font-display text-xl font-bold num">{value}</div>
    </Link>
  );
}

function WeekStrip({ workouts }: { workouts: { date: string; muscle_group: string }[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { d, iso: toISODate(d) };
  });
  const lookup = new Map(workouts.map((w) => [w.date, w.muscle_group]));
  const dayLabels = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

  return (
    <div className="flex gap-1.5">
      {days.map(({ d, iso }) => {
        const has = lookup.has(iso);
        const isToday = iso === toISODate(new Date());
        return (
          <div
            key={iso}
            className={`flex-1 aspect-square rounded-xl flex flex-col items-center justify-center text-xs border transition ${
              has
                ? "bg-accent text-black border-accent font-bold"
                : isToday
                ? "border-accent/40 text-fg"
                : "bg-surface-2 border-border text-muted"
            }`}
          >
            <span>{dayLabels[d.getDay()]}</span>
            <span className="num text-[10px] opacity-80">{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

function muscleToHebrew(g: string) {
  const map: Record<string, string> = {
    chest: "חזה",
    back: "גב",
    legs: "רגליים",
    shoulders: "כתפיים",
    arms: "ידיים",
    core: "בטן",
    cardio: "אירובי",
    full_body: "כל הגוף",
  };
  return map[g] || g;
}

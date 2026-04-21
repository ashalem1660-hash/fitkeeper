"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronRight, TrendingUp, Dumbbell, Target, Trophy, Calendar } from "lucide-react";

type Metric = "weight" | "volume" | "max_reps";

type Point = {
  date: string;
  weight: number;
  volume: number;
  max_reps: number;
};

type SetRow = {
  weight_kg: number | null;
  reps: number | null;
  workout_exercises: {
    name: string;
    user_id: string;
    workouts: { date: string } | null;
  } | null;
};

export function ProgressClient({
  exerciseNames,
}: {
  exerciseNames: string[];
  userId: string;
}) {
  const [selected, setSelected] = useState<string | null>(
    exerciseNames[0] ?? null
  );
  const [metric, setMetric] = useState<Metric>("weight");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    thisWeek: number;
    lastWeek: number;
    avg4Weeks: number;
    totalVolumeKg: number;
  } | null>(null);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data } = await supabase
        .from("exercise_sets")
        .select(
          "weight_kg, reps, workout_exercises!inner(name, user_id, workouts!inner(date))"
        )
        .eq("workout_exercises.user_id", u.user.id)
        .eq("workout_exercises.name", selected);

      // Group by date, compute max weight, max reps, total volume
      const byDate = new Map<string, { w: number; r: number; v: number }>();
      (data as unknown as SetRow[] | null)?.forEach((row) => {
        const date = row.workout_exercises?.workouts?.date;
        if (!date) return;
        const w = row.weight_kg || 0;
        const r = row.reps || 0;
        const v = w * r;
        const cur = byDate.get(date) || { w: 0, r: 0, v: 0 };
        byDate.set(date, {
          w: Math.max(cur.w, w),
          r: Math.max(cur.r, r),
          v: cur.v + v,
        });
      });

      const sorted = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({
          date: date.slice(5), // MM-DD
          weight: v.w,
          volume: Math.round(v.v),
          max_reps: v.r,
        }));

      setPoints(sorted);
      setLoading(false);
    })();
  }, [selected]);

  // Load global weekly insights (not per-exercise)
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);
      const fourWeeksAgo = new Date(startOfWeek);
      fourWeeksAgo.setDate(startOfWeek.getDate() - 28);

      const iso = (d: Date) => d.toISOString().slice(0, 10);

      const { data: workouts } = await supabase
        .from("workouts")
        .select("date")
        .eq("user_id", u.user.id)
        .gte("date", iso(fourWeeksAgo));

      let thisWeek = 0;
      let lastWeek = 0;
      let last4 = 0;
      (workouts ?? []).forEach((w) => {
        const d = new Date(w.date);
        if (d >= startOfWeek) thisWeek++;
        else if (d >= startOfLastWeek) lastWeek++;
        if (d >= fourWeeksAgo) last4++;
      });

      // Total weekly volume across all exercises
      const { data: volRows } = await supabase
        .from("exercise_sets")
        .select("weight_kg, reps, workout_exercises!inner(user_id, workouts!inner(date))")
        .eq("workout_exercises.user_id", u.user.id)
        .gte("workout_exercises.workouts.date", iso(startOfWeek));

      let totalVolume = 0;
      (volRows as unknown as SetRow[] | null)?.forEach((r) => {
        totalVolume += (r.weight_kg || 0) * (r.reps || 0);
      });

      setInsights({
        thisWeek,
        lastWeek,
        avg4Weeks: +(last4 / 4).toFixed(1),
        totalVolumeKg: Math.round(totalVolume),
      });
    })();
  }, []);

  const pr = useMemo(() => {
    if (!points.length) return null;
    const maxPoint = points.reduce((a, b) => (b.weight > a.weight ? b : a));
    return maxPoint;
  }, [points]);

  const metricLabel =
    metric === "weight" ? "משקל (ק״ג)" : metric === "volume" ? "נפח (ק״ג × חזרות)" : "חזרות מקס׳";

  return (
    <div className="px-4 py-4 space-y-4">
      <Link
        href="/gym"
        className="chip hover:border-accent/40 flex items-center gap-1 w-fit"
      >
        <ChevronRight className="w-3 h-3" />
        חזרה לאימונים
      </Link>

      {/* Weekly insights */}
      {insights && (
        <section className="grid grid-cols-2 gap-3">
          <InsightCard
            icon={<Calendar className="w-4 h-4" />}
            label="אימונים השבוע"
            value={String(insights.thisWeek)}
            sub={
              insights.lastWeek === insights.thisWeek
                ? "כמו שבוע שעבר"
                : insights.thisWeek > insights.lastWeek
                ? `+${insights.thisWeek - insights.lastWeek} משבוע שעבר`
                : `${insights.thisWeek - insights.lastWeek} משבוע שעבר`
            }
          />
          <InsightCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="ממוצע 4 שבועות"
            value={String(insights.avg4Weeks)}
            sub="אימונים לשבוע"
          />
          <InsightCard
            icon={<Dumbbell className="w-4 h-4" />}
            label="נפח השבוע"
            value={
              insights.totalVolumeKg >= 1000
                ? `${(insights.totalVolumeKg / 1000).toFixed(1)} טון`
                : `${insights.totalVolumeKg} ק״ג`
            }
            sub="סה״כ נפח מורם"
          />
          {pr && (
            <InsightCard
              icon={<Trophy className="w-4 h-4" />}
              label={`שיא ב-${selected?.slice(0, 12) || "תרגיל"}`}
              value={`${pr.weight} ק״ג`}
              sub={`ב-${pr.date}`}
            />
          )}
        </section>
      )}

      {/* Exercise picker */}
      {exerciseNames.length === 0 ? (
        <div className="card p-8 text-center">
          <Dumbbell className="w-12 h-12 text-muted mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold mb-1">
            אין עדיין נתונים
          </h2>
          <p className="text-muted text-sm">
            התחל אימון ורשום סטים כדי לראות התקדמות
          </p>
        </div>
      ) : (
        <>
          <section className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-accent" />
              <h3 className="font-semibold">בחר תרגיל</h3>
            </div>
            <select
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value)}
              className="input"
            >
              {exerciseNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </section>

          <section className="card p-4">
            <div className="flex gap-1 mb-3 bg-surface-2 rounded-xl p-1">
              {(["weight", "volume", "max_reps"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition ${
                    metric === m ? "bg-accent text-black font-semibold" : "text-muted"
                  }`}
                >
                  {m === "weight" ? "משקל" : m === "volume" ? "נפח" : "חזרות"}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted mb-2">
              {metricLabel} לאורך זמן
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted text-sm">
                טוען...
              </div>
            ) : points.length < 2 ? (
              <div className="h-48 flex items-center justify-center text-muted text-sm text-center px-4">
                צריך לפחות 2 אימונים כדי להציג גרף.
                <br />
                המשך להתאמן והתוצאות יופיעו.
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={points}
                    margin={{ right: 8, left: -20, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(40 40 50)" />
                    <XAxis dataKey="date" tick={{ fill: "#96a", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#96a", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgb(20 20 26)",
                        border: "1px solid rgb(40 40 50)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#f5f5f7" }}
                    />
                    <Line
                      type="monotone"
                      dataKey={metric}
                      stroke="rgb(255 92 53)"
                      strokeWidth={2.5}
                      dot={{ fill: "rgb(255 92 53)", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-muted text-xs mb-1">
        {icon} {label}
      </div>
      <div className="font-display text-xl font-bold num">{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

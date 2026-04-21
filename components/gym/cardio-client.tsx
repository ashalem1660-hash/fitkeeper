"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CardioSession } from "@/lib/types";
import {
  CARDIO_LABELS,
  CARDIO_EMOJI,
  estimateCardioCalories,
  paceFromDistanceDuration,
  type CardioActivity,
} from "@/lib/utils/cardio";
import {
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  TrendingUp,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ACTIVITIES = Object.keys(CARDIO_LABELS) as CardioActivity[];

export function CardioClient({
  today,
  weightKg,
  initialSessions,
}: {
  today: string;
  weightKg: number;
  initialSessions: CardioSession[];
}) {
  const [sessions, setSessions] = useState<CardioSession[]>(initialSessions);
  const [logging, setLogging] = useState(false);
  const [filter, setFilter] = useState<CardioActivity | "all">("all");

  async function deleteSession(id: string) {
    if (!confirm("למחוק את האימון?")) return;
    const supabase = createClient();
    await supabase.from("cardio_sessions").delete().eq("id", id);
    setSessions(sessions.filter((s) => s.id !== id));
  }

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.activity === filter);

  // Build chart data for the filtered activity
  const chartData = useMemo(() => {
    if (filter === "all") return [];
    return sessions
      .filter((s) => s.activity === filter)
      .slice()
      .reverse()
      .map((s) => ({
        date: s.date.slice(5),
        duration: s.duration_min || 0,
        distance: s.distance_km || 0,
        paceMin:
          s.distance_km && s.duration_min && s.distance_km > 0
            ? +(s.duration_min / s.distance_km).toFixed(2)
            : 0,
      }));
  }, [sessions, filter]);

  // Stats
  const stats = useMemo(() => {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const iso = thisWeekStart.toISOString().slice(0, 10);

    const thisWeek = sessions.filter((s) => s.date >= iso);
    const weekCount = thisWeek.length;
    const weekMinutes = thisWeek.reduce((a, s) => a + (s.duration_min || 0), 0);
    const totalDistance = sessions.reduce(
      (a, s) => a + (s.distance_km || 0),
      0
    );
    const longestSession = sessions.reduce(
      (max, s) => ((s.duration_min || 0) > (max || 0) ? s.duration_min : max),
      0 as number | null
    );

    return { weekCount, weekMinutes, totalDistance, longestSession };
  }, [sessions]);

  return (
    <div className="px-4 py-4 space-y-4">
      <Link
        href="/gym"
        className="chip hover:border-accent/40 flex items-center gap-1 w-fit"
      >
        <ChevronRight className="w-3 h-3" />
        חזרה לאימונים
      </Link>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="השבוע"
          value={`${stats.weekCount}`}
          sub={`${Math.round(stats.weekMinutes)} דק׳`}
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="מרחק כולל"
          value={`${stats.totalDistance.toFixed(1)}`}
          sub="ק״מ"
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="אימון הכי ארוך"
          value={`${stats.longestSession || 0}`}
          sub="דק׳"
        />
        <StatCard
          icon={<Plus className="w-4 h-4" />}
          label="סה״כ"
          value={`${sessions.length}`}
          sub="אימונים"
        />
      </section>

      {!logging && (
        <button onClick={() => setLogging(true)} className="btn-primary w-full">
          <Plus className="w-4 h-4" />
          רשום אימון אירובי
        </button>
      )}

      {logging && (
        <LogForm
          today={today}
          weightKg={weightKg}
          onCancel={() => setLogging(false)}
          onLogged={(s) => {
            setSessions([s, ...sessions]);
            setLogging(false);
          }}
        />
      )}

      {/* Activity filter */}
      <section className="card p-3">
        <div className="text-xs text-muted mb-2">סנן לפי פעילות</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "chip-active"
                : "chip hover:border-accent/40"
            }
          >
            הכל
          </button>
          {ACTIVITIES.map((a) => {
            const count = sessions.filter((s) => s.activity === a).length;
            if (count === 0) return null;
            return (
              <button
                key={a}
                onClick={() => setFilter(a)}
                className={
                  filter === a
                    ? "chip-active"
                    : "chip hover:border-accent/40"
                }
              >
                <span>{CARDIO_EMOJI[a]}</span>
                {CARDIO_LABELS[a]} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Progress chart */}
      {filter !== "all" && chartData.length >= 2 && (
        <section className="card p-4">
          <h3 className="font-semibold mb-1">התקדמות — {CARDIO_LABELS[filter]}</h3>
          <div className="text-xs text-muted mb-3">
            {chartData[0].paceMin > 0 ? "קצב (דקות לק״מ)" : "משך (דקות)"} לאורך זמן
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ right: 8, left: -20, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(40 40 50)" />
                <XAxis dataKey="date" tick={{ fill: "#96a", fontSize: 10 }} />
                <YAxis
                  tick={{ fill: "#96a", fontSize: 10 }}
                  domain={
                    chartData[0].paceMin > 0 ? ["dataMin - 0.5", "dataMax + 0.5"] : [0, "auto"]
                  }
                  reversed={chartData[0].paceMin > 0}
                />
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
                  dataKey={chartData[0].paceMin > 0 ? "paceMin" : "duration"}
                  stroke="rgb(255 92 53)"
                  strokeWidth={2.5}
                  dot={{ fill: "rgb(255 92 53)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {chartData[0].paceMin > 0 && (
            <div className="text-[10px] text-muted text-center mt-2">
              קצב נמוך יותר = מהיר יותר (טוב יותר)
            </div>
          )}
        </section>
      )}

      {/* History */}
      <section>
        <h3 className="font-semibold mb-3">היסטוריה</h3>
        {filteredSessions.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-muted text-sm">
              {filter === "all" ? "עדיין לא רשמת אימוני אירובי" : "אין אימונים בפילטר"}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((s) => (
              <div key={s.id} className="card p-3 flex items-center gap-3">
                <div className="text-2xl">
                  {CARDIO_EMOJI[s.activity as CardioActivity] || "🏃"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    {CARDIO_LABELS[s.activity as CardioActivity] || s.activity}
                  </div>
                  <div className="text-xs text-muted num">
                    {s.date} · {s.duration_min || 0} דק׳
                    {s.distance_km ? ` · ${s.distance_km} ק״מ` : ""}
                    {s.distance_km && s.duration_min
                      ? ` · ${paceFromDistanceDuration(s.distance_km, s.duration_min)} /ק״מ`
                      : ""}
                    {s.calories ? ` · ${Math.round(s.calories)} קלו׳` : ""}
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="w-9 h-9 rounded-lg hover:bg-danger/20 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 text-muted" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
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

function LogForm({
  today,
  weightKg,
  onCancel,
  onLogged,
}: {
  today: string;
  weightKg: number;
  onCancel: () => void;
  onLogged: (s: CardioSession) => void;
}) {
  const [activity, setActivity] = useState<CardioActivity>("running");
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [saving, setSaving] = useState(false);

  const durNum = parseFloat(duration) || 0;
  const distNum = parseFloat(distance) || 0;
  const calculatedCalories =
    durNum > 0
      ? estimateCardioCalories({
          activity,
          durationMin: durNum,
          weightKg,
          distanceKm: distNum || null,
        })
      : 0;
  const pace =
    distNum > 0 && durNum > 0 ? paceFromDistanceDuration(distNum, durNum) : null;

  async function save() {
    if (!durNum) return;
    setSaving(true);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }

    const { data } = await supabase
      .from("cardio_sessions")
      .insert({
        user_id: u.user.id,
        date,
        activity,
        duration_min: durNum,
        distance_km: distNum || null,
        calories: calculatedCalories || null,
      })
      .select()
      .single();

    setSaving(false);
    if (data) onLogged(data as CardioSession);
  }

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold">אימון חדש</h3>

      <div>
        <label className="label">פעילות</label>
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              className={
                activity === a
                  ? "chip-active py-2 flex-col gap-0 justify-center"
                  : "chip py-2 flex-col gap-0 justify-center hover:border-accent/40"
              }
            >
              <span className="text-lg">{CARDIO_EMOJI[a]}</span>
              <span className="text-[10px]">{CARDIO_LABELS[a]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">תאריך</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">משך (דקות)</label>
          <input
            type="number"
            inputMode="decimal"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input num text-center"
            placeholder="30"
            autoFocus
          />
        </div>
        <div>
          <label className="label">מרחק (ק״מ)</label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="input num text-center"
            placeholder="5"
          />
        </div>
      </div>

      {(calculatedCalories > 0 || pace) && (
        <div className="card-2 p-3 space-y-1">
          {pace && (
            <div className="text-sm">
              קצב: <span className="font-bold num">{pace}</span> דקות לק״מ
            </div>
          )}
          {calculatedCalories > 0 && (
            <div className="text-sm">
              קלוריות משוערות:{" "}
              <span className="font-bold num">{calculatedCalories}</span>
              <span className="text-xs text-muted"> (לפי משקל {weightKg} ק״ג)</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1">
          ביטול
        </button>
        <button
          onClick={save}
          disabled={!durNum || saving}
          className="btn-primary flex-1"
        >
          {saving ? "שומר..." : "שמור"}
        </button>
      </div>
    </div>
  );
}

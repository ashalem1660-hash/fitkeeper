"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getWeekDays,
  toISODate,
  fromISODate,
  addDays,
  hebrewFormat,
  HEBREW_DAYS_SHORT,
} from "@/lib/utils/date";
import { ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { WorkoutView } from "./workout-view";
import { MUSCLE_GROUPS, MUSCLE_EMOJI, type MuscleGroup } from "@/lib/utils/exercises";

type WeekWorkout = { id: string; date: string; muscle_group: string; name: string | null };

export function GymClient({
  initialDate,
  weekWorkouts,
}: {
  initialDate: string;
  weekWorkouts: WeekWorkout[];
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [weekRef, setWeekRef] = useState(fromISODate(initialDate));
  const [workouts, setWorkouts] = useState<WeekWorkout[]>(weekWorkouts);
  const [refreshKey, setRefreshKey] = useState(0);

  const days = getWeekDays(weekRef);
  const workoutsByDate = new Map<string, WeekWorkout[]>();
  workouts.forEach((w) => {
    const arr = workoutsByDate.get(w.date) ?? [];
    arr.push(w);
    workoutsByDate.set(w.date, arr);
  });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const start = getWeekDays(weekRef)[0];
      const end = getWeekDays(weekRef)[6];
      const { data } = await supabase
        .from("workouts")
        .select("id, date, muscle_group, name")
        .eq("user_id", u.user.id)
        .gte("date", toISODate(start))
        .lte("date", toISODate(end));
      setWorkouts(data ?? []);
    })();
  }, [weekRef, refreshKey]);

  function shiftWeek(dir: 1 | -1) {
    setWeekRef(addDays(weekRef, dir * 7));
  }

  const todayISO = toISODate(new Date());
  const selectedWorkouts = workoutsByDate.get(selectedDate) ?? [];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          {/* In RTL, "previous" (older) is visually to the right */}
          <button
            onClick={() => shiftWeek(-1)}
            className="w-9 h-9 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center"
            aria-label="שבוע קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="font-semibold text-sm">
            {hebrewFormat(days[0]).split(",")[1]?.trim()} – {hebrewFormat(days[6]).split(",")[1]?.trim()}
          </div>
          <button
            onClick={() => shiftWeek(1)}
            className="w-9 h-9 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center"
            aria-label="שבוע הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const iso = toISODate(d);
            const isSelected = iso === selectedDate;
            const isToday = iso === todayISO;
            const dayWorkouts = workoutsByDate.get(iso) ?? [];
            const has = dayWorkouts.length > 0;

            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`relative aspect-[3/4] rounded-xl flex flex-col items-center justify-center text-xs transition-all border ${
                  isSelected
                    ? "bg-accent text-black border-accent font-bold scale-[1.02]"
                    : has
                    ? "bg-accent/15 border-accent/40 text-fg"
                    : isToday
                    ? "bg-surface-2 border-accent/30 text-fg"
                    : "bg-surface-2 border-border text-muted hover:border-border"
                }`}
              >
                <span className="text-[10px] opacity-80">{HEBREW_DAYS_SHORT[d.getDay()]}</span>
                <span className="font-display text-lg num">{d.getDate()}</span>
                {has && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold mb-3">
          {hebrewFormat(fromISODate(selectedDate))}
        </h2>

        {selectedWorkouts.length === 0 ? (
          <StartWorkoutPanel date={selectedDate} onCreated={() => setRefreshKey((k) => k + 1)} />
        ) : (
          <div className="space-y-3">
            {selectedWorkouts.map((w) => (
              <WorkoutView
                key={w.id}
                workoutId={w.id}
                muscleGroup={w.muscle_group}
                date={selectedDate}
                onChanged={() => setRefreshKey((k) => k + 1)}
              />
            ))}
            <StartWorkoutPanel date={selectedDate} compact onCreated={() => setRefreshKey((k) => k + 1)} />
          </div>
        )}
      </div>
    </div>
  );
}

function StartWorkoutPanel({
  date,
  compact,
  onCreated,
}: {
  date: string;
  compact?: boolean;
  onCreated: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  async function createWorkout(group: MuscleGroup) {
    setCreating(group);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("workouts").insert({
      user_id: u.user.id,
      date,
      muscle_group: group,
    });
    setCreating(null);
    setPicking(false);
    onCreated();
  }

  if (!picking) {
    return (
      <button
        onClick={() => setPicking(true)}
        className={`card p-5 w-full flex items-center justify-center gap-2 ${
          compact ? "py-4" : "py-8"
        } hover:border-accent/40 transition`}
      >
        <Plus className="w-5 h-5 text-accent" />
        <span className="font-semibold">{compact ? "הוסף אימון נוסף" : "התחל אימון חדש"}</span>
      </button>
    );
  }

  return (
    <div className="card p-4">
      <div className="text-sm text-muted mb-3">בחר קבוצת שרירים</div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map((g) => (
          <button
            key={g}
            onClick={() => createWorkout(g)}
            disabled={!!creating}
            className="card-2 p-3 hover:border-accent/40 transition text-right flex items-center gap-2"
          >
            <span className="text-xl">{MUSCLE_EMOJI[g]}</span>
            <span className="font-medium">{MUSCLE_GROUPS[g]}</span>
          </button>
        ))}
      </div>
      <button onClick={() => setPicking(false)} className="btn-ghost w-full mt-3">ביטול</button>
    </div>
  );
}

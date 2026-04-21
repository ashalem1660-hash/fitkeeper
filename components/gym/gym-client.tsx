"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
      {/* Quick access row */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/gym/routines"
          className="chip hover:border-accent/40 justify-center py-2"
        >
          📋 תבניות
        </Link>
        <Link
          href="/gym/cardio"
          className="chip hover:border-accent/40 justify-center py-2"
        >
          🏃 אירובי
        </Link>
        <Link
          href="/gym/progress"
          className="chip hover:border-accent/40 justify-center py-2"
        >
          📈 התקדמות
        </Link>
      </div>

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
  const [mode, setMode] = useState<"routine" | "empty">("routine");
  const [routines, setRoutines] = useState<{ id: string; name: string; muscle_group: string }[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

  async function loadRoutines() {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("routines")
      .select("id, name, muscle_group")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    setRoutines(data ?? []);
  }

  useEffect(() => {
    if (picking) loadRoutines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picking]);

  async function createEmptyWorkout(group: MuscleGroup) {
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

  async function createFromRoutine(routineId: string, routineName: string, group: string) {
    setCreating(routineId);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    // 1) Create workout
    const { data: workout } = await supabase
      .from("workouts")
      .insert({ user_id: u.user.id, date, muscle_group: group, name: routineName })
      .select()
      .single();

    if (!workout) {
      setCreating(null);
      return;
    }

    // 2) Load routine exercises
    const { data: rexs } = await supabase
      .from("routine_exercises")
      .select("name, order_index, target_sets, target_reps")
      .eq("routine_id", routineId)
      .order("order_index", { ascending: true });

    // 3) Insert workout_exercises + pre-fill sets from last time
    if (rexs && rexs.length) {
      for (const rex of rexs) {
        const { data: wex } = await supabase
          .from("workout_exercises")
          .insert({
            workout_id: workout.id,
            user_id: u.user.id,
            name: rex.name,
            order_index: rex.order_index,
          })
          .select()
          .single();

        if (wex) {
          // Find last sets for this exercise name across all user's history
          const { data: lastSets } = await supabase
            .from("exercise_sets")
            .select("weight_kg, reps, set_number, exercise_id, workout_exercises!inner(name, user_id)")
            .eq("workout_exercises.user_id", u.user.id)
            .eq("workout_exercises.name", rex.name)
            .order("created_at", { ascending: false })
            .limit(20);

          // Group by exercise_id, pick most recent one
          let seedSets: { weight_kg: number | null; reps: number | null }[] = [];
          if (lastSets && lastSets.length > 0) {
            const lastExId = lastSets[0].exercise_id;
            seedSets = lastSets
              .filter((s) => s.exercise_id === lastExId)
              .sort((a, b) => a.set_number - b.set_number)
              .map((s) => ({ weight_kg: s.weight_kg, reps: s.reps }));
          }

          const targetCount = rex.target_sets || 3;
          const targetReps = rex.target_reps || 10;
          const setsToCreate = Array.from({ length: targetCount }, (_, i) => ({
            exercise_id: wex.id,
            user_id: u.user!.id,
            set_number: i + 1,
            weight_kg: seedSets[i]?.weight_kg ?? null,
            reps: seedSets[i]?.reps ?? targetReps,
          }));

          if (setsToCreate.length) {
            await supabase.from("exercise_sets").insert(setsToCreate);
          }
        }
      }
    }

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
      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-surface-2 rounded-xl p-1">
        <button
          onClick={() => setMode("routine")}
          className={`flex-1 py-1.5 text-sm rounded-lg transition ${
            mode === "routine" ? "bg-accent text-black font-semibold" : "text-muted"
          }`}
        >
          מתבנית
        </button>
        <button
          onClick={() => setMode("empty")}
          className={`flex-1 py-1.5 text-sm rounded-lg transition ${
            mode === "empty" ? "bg-accent text-black font-semibold" : "text-muted"
          }`}
        >
          מאפס
        </button>
      </div>

      {mode === "routine" && (
        <div className="space-y-2">
          {routines.length === 0 ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-sm text-muted">עוד אין לך תבניות אימון</div>
              <Link href="/gym/routines" className="btn-primary inline-flex">
                <Plus className="w-4 h-4" />
                צור תבנית
              </Link>
            </div>
          ) : (
            <>
              {routines.map((r) => (
                <button
                  key={r.id}
                  onClick={() => createFromRoutine(r.id, r.name, r.muscle_group)}
                  disabled={!!creating}
                  className="card-2 p-3 w-full text-right flex items-center gap-2 hover:border-accent/40 transition"
                >
                  <span className="text-xl">{MUSCLE_EMOJI[r.muscle_group as MuscleGroup]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted">
                      {MUSCLE_GROUPS[r.muscle_group as MuscleGroup]}
                    </div>
                  </div>
                  {creating === r.id && <span className="text-xs text-muted">טוען...</span>}
                </button>
              ))}
              <Link
                href="/gym/routines"
                className="w-full card-2 p-2.5 flex items-center justify-center gap-1.5 text-sm hover:border-accent/40 transition"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                נהל תבניות
              </Link>
            </>
          )}
        </div>
      )}

      {mode === "empty" && (
        <>
          <div className="text-sm text-muted mb-3">בחר קבוצת שרירים</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map((g) => (
              <button
                key={g}
                onClick={() => createEmptyWorkout(g)}
                disabled={!!creating}
                className="card-2 p-3 hover:border-accent/40 transition text-right flex items-center gap-2"
              >
                <span className="text-xl">{MUSCLE_EMOJI[g]}</span>
                <span className="font-medium">{MUSCLE_GROUPS[g]}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <button onClick={() => setPicking(false)} className="btn-ghost w-full mt-3">
        ביטול
      </button>
    </div>
  );
}

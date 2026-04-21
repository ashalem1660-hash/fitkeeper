"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Routine, RoutineExercise } from "@/lib/types";
import {
  MUSCLE_GROUPS,
  MUSCLE_EMOJI,
  exercisesForGroup,
  type MuscleGroup,
} from "@/lib/utils/exercises";
import { Plus, Trash2, ChevronRight, X, Save, Dumbbell } from "lucide-react";

export function RoutinesClient({
  initialRoutines,
}: {
  initialRoutines: Routine[];
}) {
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function createRoutine(name: string, group: MuscleGroup) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("routines")
      .insert({ user_id: u.user.id, name, muscle_group: group })
      .select()
      .single();
    if (data) {
      setRoutines([data as Routine, ...routines]);
      setCreating(false);
      setEditingId(data.id);
    }
  }

  async function deleteRoutine(id: string) {
    if (!confirm("למחוק את התבנית?")) return;
    const supabase = createClient();
    await supabase.from("routines").delete().eq("id", id);
    setRoutines(routines.filter((r) => r.id !== id));
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <Link
        href="/gym"
        className="chip hover:border-accent/40 flex items-center gap-1 w-fit"
      >
        <ChevronRight className="w-3 h-3" />
        חזרה לאימונים
      </Link>

      {routines.length === 0 && !creating && (
        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="w-7 h-7 text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold mb-1">עדיין אין תבניות</h2>
          <p className="text-muted text-sm mb-4">
            צור שגרת אימון אחת ותוכל להפעיל אותה בלחיצה כל פעם
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            צור תבנית ראשונה
          </button>
        </div>
      )}

      {routines.length > 0 && (
        <>
          <button onClick={() => setCreating(true)} className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            תבנית חדשה
          </button>

          <div className="space-y-2">
            {routines.map((r) => (
              <div
                key={r.id}
                className="card p-4 flex items-center gap-3"
              >
                <div className="text-2xl">
                  {MUSCLE_EMOJI[r.muscle_group as MuscleGroup] || "💪"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{r.name}</div>
                  <div className="text-xs text-muted">
                    {MUSCLE_GROUPS[r.muscle_group as MuscleGroup] || r.muscle_group}
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(r.id)}
                  className="chip hover:border-accent/40"
                >
                  ערוך
                </button>
                <button
                  onClick={() => deleteRoutine(r.id)}
                  className="w-9 h-9 rounded-lg bg-danger/10 hover:bg-danger/20 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {creating && (
        <CreateModal
          onCancel={() => setCreating(false)}
          onCreate={createRoutine}
        />
      )}

      {editingId && (
        <EditModal
          routineId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function CreateModal({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string, group: MuscleGroup) => void;
}) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup>("chest");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="card max-w-md w-full mx-0 sm:mx-4 p-5 rounded-t-3xl sm:rounded-3xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">תבנית חדשה</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="label">שם התבנית</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input mb-3"
          placeholder="למשל: חזה + יד אחורית"
          autoFocus
        />

        <label className="label">קבוצת שרירים עיקרית</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={
                group === g
                  ? "chip-active py-2.5 justify-center"
                  : "chip py-2.5 justify-center hover:border-accent/40"
              }
            >
              <span className="text-base">{MUSCLE_EMOJI[g]}</span>
              <span>{MUSCLE_GROUPS[g]}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => name && onCreate(name, group)}
          disabled={!name}
          className="btn-primary w-full"
        >
          צור והוסף תרגילים
        </button>
      </div>
    </div>
  );
}

function EditModal({
  routineId,
  onClose,
}: {
  routineId: string;
  onClose: () => void;
}) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [addingExercise, setAddingExercise] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const [{ data: r }, { data: ex }] = await Promise.all([
      supabase.from("routines").select("*").eq("id", routineId).maybeSingle(),
      supabase
        .from("routine_exercises")
        .select("*")
        .eq("routine_id", routineId)
        .order("order_index", { ascending: true }),
    ]);
    setRoutine(r);
    setExercises(ex ?? []);
    setLoading(false);
  }

  // Load on first render
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId]);

  async function addExercise(name: string) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("routine_exercises")
      .insert({
        routine_id: routineId,
        user_id: u.user.id,
        name,
        order_index: exercises.length,
        target_sets: 3,
        target_reps: 10,
      })
      .select()
      .single();
    if (data) {
      setExercises([...exercises, data as RoutineExercise]);
      setAddingExercise(false);
    }
  }

  async function updateExercise(
    id: string,
    field: "target_sets" | "target_reps",
    value: string
  ) {
    const num = value === "" ? null : parseInt(value, 10);
    const supabase = createClient();
    await supabase.from("routine_exercises").update({ [field]: num }).eq("id", id);
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: num } : e))
    );
  }

  async function removeExercise(id: string) {
    const supabase = createClient();
    await supabase.from("routine_exercises").delete().eq("id", id);
    setExercises(exercises.filter((e) => e.id !== id));
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <div className="card p-6">
          <div className="text-muted">טוען...</div>
        </div>
      </div>
    );
  }

  if (!routine) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full mx-0 sm:mx-4 p-5 rounded-t-3xl sm:rounded-3xl animate-fade-in max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {MUSCLE_EMOJI[routine.muscle_group as MuscleGroup]}
            </span>
            <div>
              <h3 className="font-bold">{routine.name}</h3>
              <p className="text-xs text-muted">
                {MUSCLE_GROUPS[routine.muscle_group as MuscleGroup]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {exercises.length === 0 && (
            <div className="text-center text-xs text-muted py-4">
              אין תרגילים בתבנית. הוסף כמה כדי להתחיל.
            </div>
          )}
          {exercises.map((ex) => (
            <div key={ex.id} className="card-2 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm">{ex.name}</div>
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="w-8 h-8 rounded-lg hover:bg-danger/20 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">סטים יעד</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    defaultValue={ex.target_sets ?? ""}
                    onBlur={(e) =>
                      updateExercise(ex.id, "target_sets", e.target.value)
                    }
                    className="input py-2 num text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">חזרות יעד</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    defaultValue={ex.target_reps ?? ""}
                    onBlur={(e) =>
                      updateExercise(ex.id, "target_reps", e.target.value)
                    }
                    className="input py-2 num text-center"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {addingExercise ? (
          <ExercisePicker
            group={routine.muscle_group as MuscleGroup}
            onPick={addExercise}
            onCancel={() => setAddingExercise(false)}
          />
        ) : (
          <button
            onClick={() => setAddingExercise(true)}
            className="w-full card-2 p-3 flex items-center justify-center gap-2 hover:border-accent/40 transition"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span className="font-medium">הוסף תרגיל</span>
          </button>
        )}

        <button onClick={onClose} className="btn-primary w-full mt-3">
          <Save className="w-4 h-4" />
          סיימתי
        </button>
      </div>
    </div>
  );
}

function ExercisePicker({
  group,
  onPick,
  onCancel,
}: {
  group: MuscleGroup;
  onPick: (name: string) => void;
  onCancel: () => void;
}) {
  const [custom, setCustom] = useState("");
  const suggestions = exercisesForGroup(group);

  return (
    <div className="card-2 p-3 space-y-3">
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="input flex-1"
          placeholder="שם תרגיל מותאם..."
        />
        <button
          onClick={() => custom && onPick(custom)}
          disabled={!custom}
          className="btn-primary"
        >
          הוסף
        </button>
      </div>

      <div>
        <div className="text-xs text-muted mb-2">מומלצים</div>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {suggestions.map((e) => (
            <button
              key={e.name}
              onClick={() => onPick(e.name)}
              className="chip hover:border-accent/40"
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onCancel} className="btn-ghost w-full text-sm">
        ביטול
      </button>
    </div>
  );
}

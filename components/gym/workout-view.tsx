"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MUSCLE_GROUPS, MUSCLE_EMOJI, exercisesForGroup, type MuscleGroup } from "@/lib/utils/exercises";
import { AI_ENABLED } from "@/lib/flags";
import { Plus, Trash2, ChevronDown, Lightbulb, X } from "lucide-react";

type Exercise = { id: string; name: string; order_index: number };
type ExSet = { id: string; set_number: number; weight_kg: number | null; reps: number | null };

export function WorkoutView({
  workoutId,
  muscleGroup,
  date,
  onChanged,
}: {
  workoutId: string;
  muscleGroup: string;
  date: string;
  onChanged: () => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [setsByEx, setSetsByEx] = useState<Record<string, ExSet[]>>({});
  const [addingEx, setAddingEx] = useState(false);
  const [showTip, setShowTip] = useState<string | null>(null);
  const [tipText, setTipText] = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: exs } = await supabase
      .from("workout_exercises")
      .select("id, name, order_index")
      .eq("workout_id", workoutId)
      .order("order_index", { ascending: true });
    setExercises(exs ?? []);

    if (exs && exs.length) {
      const { data: sets } = await supabase
        .from("exercise_sets")
        .select("id, exercise_id, set_number, weight_kg, reps")
        .in(
          "exercise_id",
          exs.map((e) => e.id)
        )
        .order("set_number", { ascending: true });
      const grouped: Record<string, ExSet[]> = {};
      (sets ?? []).forEach((s: any) => {
        grouped[s.exercise_id] = grouped[s.exercise_id] || [];
        grouped[s.exercise_id].push(s);
      });
      setSetsByEx(grouped);
    } else {
      setSetsByEx({});
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  async function addExercise(name: string) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("workout_exercises").insert({
      workout_id: workoutId,
      user_id: u.user.id,
      name,
      order_index: exercises.length,
    });
    setAddingEx(false);
    await load();
  }

  async function deleteExercise(id: string) {
    const supabase = createClient();
    await supabase.from("workout_exercises").delete().eq("id", id);
    await load();
  }

  async function addSet(exerciseId: string) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const current = setsByEx[exerciseId] ?? [];
    const lastSet = current[current.length - 1];
    await supabase.from("exercise_sets").insert({
      exercise_id: exerciseId,
      user_id: u.user.id,
      set_number: current.length + 1,
      weight_kg: lastSet?.weight_kg ?? null,
      reps: lastSet?.reps ?? null,
    });
    await load();
  }

  async function updateSet(setId: string, field: "weight_kg" | "reps", value: string) {
    const num = value === "" ? null : parseFloat(value);
    const supabase = createClient();
    await supabase.from("exercise_sets").update({ [field]: num }).eq("id", setId);
    setSetsByEx((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = next[k].map((s) => (s.id === setId ? { ...s, [field]: num } : s));
      }
      return next;
    });
  }

  async function deleteSet(setId: string) {
    const supabase = createClient();
    await supabase.from("exercise_sets").delete().eq("id", setId);
    await load();
  }

  async function deleteWorkout() {
    if (!confirm("למחוק את האימון הזה לגמרי?")) return;
    const supabase = createClient();
    await supabase.from("workouts").delete().eq("id", workoutId);
    onChanged();
  }

  async function loadTip(exName: string) {
    setShowTip(exName);
    setTipLoading(true);
    setTipText("");
    try {
      const res = await fetch("/api/ai/form-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise: exName }),
      });
      const data = await res.json();
      setTipText(data.text || "לא הצלחתי להביא טיפים כרגע.");
    } catch {
      setTipText("שגיאה בטעינת טיפים.");
    } finally {
      setTipLoading(false);
    }
  }

  const group = muscleGroup as MuscleGroup;
  const groupLabel = MUSCLE_GROUPS[group] || muscleGroup;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{MUSCLE_EMOJI[group] || "💪"}</span>
          <div>
            <div className="font-display text-lg font-bold">{groupLabel}</div>
            <div className="text-xs text-muted">
              {exercises.length} תרגילים · {Object.values(setsByEx).flat().length} סטים
            </div>
          </div>
        </div>
        <button
          onClick={deleteWorkout}
          className="w-9 h-9 rounded-lg bg-danger/10 hover:bg-danger/20 flex items-center justify-center"
          aria-label="מחק אימון"
        >
          <Trash2 className="w-4 h-4 text-danger" />
        </button>
      </div>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseBlock
            key={ex.id}
            exercise={ex}
            sets={setsByEx[ex.id] ?? []}
            onAddSet={() => addSet(ex.id)}
            onUpdateSet={updateSet}
            onDeleteSet={deleteSet}
            onDelete={() => deleteExercise(ex.id)}
            onTip={() => loadTip(ex.name)}
          />
        ))}
      </div>

      {addingEx ? (
        <ExercisePicker group={group} onPick={addExercise} onCancel={() => setAddingEx(false)} />
      ) : (
        <button
          onClick={() => setAddingEx(true)}
          className="mt-3 w-full card-2 p-3 flex items-center justify-center gap-2 hover:border-accent/40 transition"
        >
          <Plus className="w-4 h-4 text-accent" />
          <span className="font-medium">הוסף תרגיל</span>
        </button>
      )}

      {showTip && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowTip(null)}
        >
          <div className="card max-w-md w-full p-5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent" />
                <h3 className="font-bold">טיפים: {showTip}</h3>
              </div>
              <button
                onClick={() => setShowTip(null)}
                className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm leading-relaxed text-fg whitespace-pre-wrap">
              {tipLoading ? "טוען טיפים..." : tipText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseBlock({
  exercise,
  sets,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onDelete,
  onTip,
}: {
  exercise: Exercise;
  sets: ExSet[];
  onAddSet: () => void;
  onUpdateSet: (id: string, field: "weight_kg" | "reps", value: string) => void;
  onDeleteSet: (id: string) => void;
  onDelete: () => void;
  onTip: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card-2 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-right">
          <ChevronDown className={`w-4 h-4 transition ${open ? "" : "-rotate-90"}`} />
          <span className="font-semibold">{exercise.name}</span>
        </button>
        <button
          onClick={onTip}
          className={`w-8 h-8 rounded-lg bg-surface hover:bg-border flex items-center justify-center ${AI_ENABLED ? "" : "hidden"}`}
          aria-label="טיפים"
        >
          <Lightbulb className="w-4 h-4 text-accent" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg bg-surface hover:bg-danger/20 flex items-center justify-center"
          aria-label="מחק תרגיל"
        >
          <Trash2 className="w-4 h-4 text-danger" />
        </button>
      </div>

      {open && (
        <>
          <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 text-xs text-muted mb-1 px-1">
            <span className="text-center">#</span>
            <span>ק״ג</span>
            <span>חזרות</span>
            <span />
          </div>

          {sets.length === 0 && (
            <div className="text-xs text-muted py-2 text-center">אין סטים — הוסף סט ראשון</div>
          )}

          {sets.map((s) => (
            <div key={s.id} className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm num font-semibold">
                {s.set_number}
              </div>
              <input
                type="number"
                step="0.5"
                inputMode="decimal"
                defaultValue={s.weight_kg ?? ""}
                onBlur={(e) => onUpdateSet(s.id, "weight_kg", e.target.value)}
                className="input py-2 px-3 num text-center"
                placeholder="0"
              />
              <input
                type="number"
                inputMode="numeric"
                defaultValue={s.reps ?? ""}
                onBlur={(e) => onUpdateSet(s.id, "reps", e.target.value)}
                className="input py-2 px-3 num text-center"
                placeholder="0"
              />
              <button
                onClick={() => onDeleteSet(s.id)}
                className="w-8 h-8 rounded-lg hover:bg-danger/20 flex items-center justify-center"
                aria-label="מחק סט"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted" />
              </button>
            </div>
          ))}

          <button
            onClick={onAddSet}
            className="mt-2 w-full py-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            הוסף סט
          </button>
        </>
      )}
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
  const [showAI, setShowAI] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const suggestions = exercisesForGroup(group);

  async function getAIIdeas() {
    setShowAI(true);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group }),
      });
      const data = await res.json();
      setAiIdeas(data.exercises || []);
    } catch {
      setAiIdeas([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 card-2 p-3 space-y-3">
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="input flex-1"
          placeholder="שם תרגיל מותאם..."
        />
        <button onClick={() => custom && onPick(custom)} disabled={!custom} className="btn-primary">
          הוסף
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted">מומלצים לקבוצה</div>
          <button onClick={getAIIdeas} className={`text-xs text-accent flex items-center gap-1 ${AI_ENABLED ? "" : "hidden"}`}>
            <Lightbulb className="w-3 h-3" />
            רעיונות AI
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {suggestions.map((e) => (
            <button key={e.name} onClick={() => onPick(e.name)} className="chip hover:border-accent/40">
              {e.name}
            </button>
          ))}
        </div>

        {showAI && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-accent mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              הצעות AI
            </div>
            {loading ? (
              <div className="text-xs text-muted">טוען...</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {aiIdeas.map((name) => (
                  <button
                    key={name}
                    onClick={() => onPick(name)}
                    className="chip border-accent/40 bg-accent/10"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={onCancel} className="btn-ghost w-full text-sm">ביטול</button>
    </div>
  );
}

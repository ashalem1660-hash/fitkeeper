"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toISODate, fromISODate, addDays, hebrewFormat } from "@/lib/utils/date";
import type { Profile, Meal, WaterLog } from "@/lib/types";
import { ChevronRight, ChevronLeft, Plus, Trash2, Droplet, Apple, Sparkles, X } from "lucide-react";
import { searchFood, type FoodItem } from "@/lib/utils/foods";
import { AI_ENABLED } from "@/lib/flags";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "ארוחת בוקר",
  lunch: "ארוחת צהריים",
  dinner: "ארוחת ערב",
  snack: "חטיף",
};
const WATER_QUICK = [250, 500, 750];

export function NutritionClient({
  initialDate,
  profile,
  initialMeals,
  initialWater,
}: {
  initialDate: string;
  profile: Profile | null;
  initialMeals: Meal[];
  initialWater: WaterLog[];
}) {
  const [date, setDate] = useState(initialDate);
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [water, setWater] = useState<WaterLog[]>(initialWater);
  const [adding, setAdding] = useState<string | null>(null);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  async function reload(d: string) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [m, w] = await Promise.all([
      supabase
        .from("meals")
        .select("*")
        .eq("user_id", u.user.id)
        .eq("date", d)
        .order("created_at", { ascending: true }),
      supabase.from("water_log").select("*").eq("user_id", u.user.id).eq("date", d),
    ]);
    setMeals(m.data ?? []);
    setWater(w.data ?? []);
  }

  async function shiftDay(dir: 1 | -1) {
    const next = toISODate(addDays(fromISODate(date), dir));
    setDate(next);
    await reload(next);
  }

  async function addWater(amount: number) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("water_log")
      .insert({ user_id: u.user.id, date, amount_ml: amount })
      .select()
      .single();
    if (data) setWater([...water, data]);
  }

  async function removeWater(id: string) {
    const supabase = createClient();
    await supabase.from("water_log").delete().eq("id", id);
    setWater(water.filter((w) => w.id !== id));
  }

  async function removeMeal(id: string) {
    const supabase = createClient();
    await supabase.from("meals").delete().eq("id", id);
    setMeals(meals.filter((m) => m.id !== id));
  }

  async function handleMealAdded(newMeal: Meal) {
    setMeals([...meals, newMeal]);
    setAdding(null);
  }

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const totalWater = water.reduce((a, w) => a + w.amount_ml, 0);

  const calTarget = profile?.calorie_target || 2000;
  const proteinTarget = profile?.protein_target || 120;
  const carbsTarget = profile?.carbs_target || 220;
  const fatTarget = profile?.fat_target || 60;
  const waterTarget = profile?.water_target_ml || 2500;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Quick access */}
      <div className="flex gap-2">
        <Link href="/nutrition/meals" className="chip hover:border-accent/40 flex-1 justify-center py-2">
          🍽️ ארוחות שמורות
        </Link>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="chip hover:border-accent/40 flex-1 justify-center py-2"
        >
          ⚡ הוסף ארוחה ליום
        </button>
      </div>

      <div className="card p-3 flex items-center justify-between">
        <button
          onClick={() => shiftDay(-1)}
          className="w-9 h-9 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="font-semibold text-sm">{hebrewFormat(fromISODate(date))}</div>
        </div>
        <button
          onClick={() => shiftDay(1)}
          className="w-9 h-9 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted">קלוריות</div>
            <div className="font-display text-3xl font-bold num">
              {Math.round(totals.calories)}
              <span className="text-muted text-lg"> / {calTarget}</span>
            </div>
          </div>
          <button onClick={() => setAdviceOpen(true)} className={`btn-ghost text-xs ${AI_ENABLED ? "" : "hidden"}`}>
            <Sparkles className="w-3.5 h-3.5" />
            ייעוץ AI
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MacroBar label="חלבון" value={totals.protein} target={proteinTarget} color="rgb(var(--accent))" />
          <MacroBar label="פחמ'" value={totals.carbs} target={carbsTarget} color="rgb(var(--accent-2))" />
          <MacroBar label="שומן" value={totals.fat} target={fatTarget} color="rgb(var(--success))" />
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-accent" />
            <h3 className="font-semibold">מים</h3>
          </div>
          <div className="text-sm num">
            {totalWater} / {waterTarget} מ״ל
          </div>
        </div>

        <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-l from-accent to-accent-2 transition-all"
            style={{ width: `${Math.min(100, (totalWater / waterTarget) * 100)}%` }}
          />
        </div>

        <div className="flex gap-2">
          {WATER_QUICK.map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} className="btn-ghost flex-1 text-sm">
              <Plus className="w-3.5 h-3.5" />
              {ml}
            </button>
          ))}
        </div>

        {water.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {water.map((w) => (
              <button
                key={w.id}
                onClick={() => removeWater(w.id)}
                className="chip num hover:bg-danger/20 hover:border-danger/40 hover:text-danger transition group"
                title="לחץ למחיקה"
              >
                <Droplet className="w-3 h-3" />
                {w.amount_ml}
                <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        )}
      </div>

      {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
        const mealsOfType = meals.filter((m) => m.meal_type === type);
        const sumCal = mealsOfType.reduce((a, m) => a + (m.calories || 0), 0);

        return (
          <div key={type} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Apple className="w-4 h-4 text-accent" />
                <h3 className="font-semibold">{MEAL_LABELS[type]}</h3>
                {sumCal > 0 && <span className="chip num">{Math.round(sumCal)} קלו'</span>}
              </div>
              <button
                onClick={() => setAdding(type)}
                className="w-8 h-8 rounded-lg bg-accent/15 hover:bg-accent/25 flex items-center justify-center"
              >
                <Plus className="w-4 h-4 text-accent" />
              </button>
            </div>

            {mealsOfType.length === 0 ? (
              <div className="text-xs text-muted text-center py-2">לא נוסף מזון</div>
            ) : (
              <div className="space-y-1.5">
                {mealsOfType.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 card-2 p-2.5">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.food_name}</div>
                      <div className="text-xs text-muted num">
                        {m.grams ? `${m.grams} ג' · ` : ""}
                        {Math.round(m.calories || 0)} קלו' · {Math.round(m.protein || 0)}ג' חלבון
                      </div>
                    </div>
                    <button
                      onClick={() => removeMeal(m.id)}
                      className="w-8 h-8 rounded-lg hover:bg-danger/20 flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {adding && (
        <AddMealModal
          mealType={adding}
          date={date}
          onClose={() => setAdding(null)}
          onAdded={handleMealAdded}
        />
      )}

      {adviceOpen && (
        <AIAdviceModal profile={profile} totals={totals} onClose={() => setAdviceOpen(false)} />
      )}

      {quickAddOpen && (
        <QuickAddTemplateModal
          date={date}
          onClose={() => setQuickAddOpen(false)}
          onAdded={(added) => {
            setMeals([...meals, ...added]);
            setQuickAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-xs num">
          {Math.round(value)}/{target}
        </div>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AddMealModal({
  mealType,
  date,
  onClose,
  onAdded,
}: {
  mealType: string;
  date: string;
  onClose: () => void;
  onAdded: (m: Meal) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState<string>("");
  const results = searchFood(query);

  async function save() {
    if (!selected) return;
    const g = parseFloat(grams) || selected.commonPortion || 100;
    const factor = g / 100;
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("meals")
      .insert({
        user_id: u.user.id,
        date,
        meal_type: mealType,
        food_name: selected.name,
        grams: g,
        calories: +(selected.calories * factor).toFixed(1),
        protein: +(selected.protein * factor).toFixed(1),
        carbs: +(selected.carbs * factor).toFixed(1),
        fat: +(selected.fat * factor).toFixed(1),
      })
      .select()
      .single();
    if (data) onAdded(data as Meal);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full mx-0 sm:mx-4 p-5 animate-fade-in rounded-t-3xl sm:rounded-3xl max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">הוסף מזון — {MEAL_LABELS[mealType]}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!selected ? (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input mb-3"
              placeholder="חפש מזון..."
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {results.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    setSelected(f);
                    setGrams(String(f.commonPortion || 100));
                  }}
                  className="card-2 p-3 w-full text-right hover:border-accent/40 transition"
                >
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-muted num">
                    {f.calories} קלו' · {f.protein}ג' חלבון · {f.carbs}ג' פחמ' / 100 ג'
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="card-2 p-3 mb-3">
              <div className="font-semibold">{selected.name}</div>
              <div className="text-xs text-muted num">
                {selected.calories} קלו' · {selected.protein}ג' חלבון / 100 ג'
              </div>
            </div>
            <label className="label">כמות בגרמים</label>
            <input
              type="number"
              inputMode="decimal"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="input mb-2 num"
              placeholder="100"
              autoFocus
            />
            {selected.portionLabel && (
              <button onClick={() => setGrams(String(selected.commonPortion))} className="chip mb-3">
                {selected.portionLabel}
              </button>
            )}
            {grams && (
              <div className="text-sm text-muted mb-3 num">
                ≈{Math.round((selected.calories * +grams) / 100)} קלוריות ·{" "}
                {Math.round((selected.protein * +grams) / 100)} ג' חלבון
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="btn-ghost flex-1">חזור</button>
              <button onClick={save} className="btn-primary flex-1">הוסף</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AIAdviceModal({
  profile,
  totals,
  onClose,
}: {
  profile: Profile | null;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ai/nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, totals }),
        });
        const data = await res.json();
        setText(data.text || "אין ייעוץ כרגע.");
      } catch {
        setText("שגיאה בטעינת הייעוץ.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full mx-0 sm:mx-4 p-5 animate-fade-in rounded-t-3xl sm:rounded-3xl max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-bold">ייעוץ תזונה אישי</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {loading ? "מכין ייעוץ..." : text}
        </div>
      </div>
    </div>
  );
}

function QuickAddTemplateModal({
  date,
  onClose,
  onAdded,
}: {
  date: string;
  onClose: () => void;
  onAdded: (added: Meal[]) => void;
}) {
  const [templates, setTemplates] = useState<
    { id: string; name: string; meal_type: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("meal_templates")
        .select("id, name, meal_type")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      setTemplates(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function addTemplate(templateId: string, mealType: string | null) {
    setAdding(templateId);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setAdding(null);
      return;
    }

    // Load template items
    const { data: items } = await supabase
      .from("meal_template_items")
      .select("*")
      .eq("template_id", templateId);

    if (!items || items.length === 0) {
      setAdding(null);
      return;
    }

    // Insert all items as meals on current date
    const toInsert = items.map((it) => ({
      user_id: u.user!.id,
      date,
      meal_type: mealType || "snack",
      food_name: it.food_name,
      grams: it.grams,
      calories: it.calories,
      protein: it.protein,
      carbs: it.carbs,
      fat: it.fat,
    }));

    const { data: inserted } = await supabase.from("meals").insert(toInsert).select();
    setAdding(null);
    if (inserted) onAdded(inserted as Meal[]);
  }

  const mealLabel = (t: string | null) =>
    t === "breakfast"
      ? "בוקר"
      : t === "lunch"
      ? "צהריים"
      : t === "dinner"
      ? "ערב"
      : t === "snack"
      ? "חטיף"
      : "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full mx-0 sm:mx-4 p-5 rounded-t-3xl sm:rounded-3xl animate-fade-in max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">הוסף ארוחה שמורה ליום</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-muted text-sm py-4 text-center">טוען...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-muted text-sm mb-3">עדיין אין ארוחות שמורות</div>
            <Link href="/nutrition/meals" onClick={onClose} className="btn-primary inline-flex">
              <Plus className="w-4 h-4" />
              צור ארוחה שמורה
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => addTemplate(t.id, t.meal_type)}
                disabled={!!adding}
                className="card-2 p-3 w-full text-right flex items-center gap-2 hover:border-accent/40 transition disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.name}</div>
                  {t.meal_type && (
                    <div className="text-xs text-muted">{mealLabel(t.meal_type)}</div>
                  )}
                </div>
                {adding === t.id ? (
                  <span className="text-xs text-muted">מוסיף...</span>
                ) : (
                  <Plus className="w-4 h-4 text-accent" />
                )}
              </button>
            ))}

            <Link
              href="/nutrition/meals"
              onClick={onClose}
              className="card-2 p-2.5 flex items-center justify-center gap-1.5 text-sm hover:border-accent/40 transition"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              נהל ארוחות שמורות
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

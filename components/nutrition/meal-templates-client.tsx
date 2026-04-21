"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { MealTemplate, MealTemplateItem } from "@/lib/types";
import { searchFood, type FoodItem } from "@/lib/utils/foods";
import { Plus, Trash2, X, Save, ChevronRight, Apple } from "lucide-react";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "בוקר",
  lunch: "צהריים",
  dinner: "ערב",
  snack: "חטיף",
};

export function MealTemplatesClient({
  initialTemplates,
}: {
  initialTemplates: MealTemplate[];
}) {
  const [templates, setTemplates] = useState<MealTemplate[]>(initialTemplates);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function createTemplate(name: string, mealType: string) {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("meal_templates")
      .insert({ user_id: u.user.id, name, meal_type: mealType })
      .select()
      .single();
    if (data) {
      setTemplates([data as MealTemplate, ...templates]);
      setCreating(false);
      setEditingId(data.id);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("למחוק את הארוחה השמורה?")) return;
    const supabase = createClient();
    await supabase.from("meal_templates").delete().eq("id", id);
    setTemplates(templates.filter((t) => t.id !== id));
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <Link href="/nutrition" className="chip hover:border-accent/40 flex items-center gap-1 w-fit">
        <ChevronRight className="w-3 h-3" />
        חזרה לתזונה
      </Link>

      {templates.length === 0 && !creating && (
        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
            <Apple className="w-7 h-7 text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold mb-1">אין ארוחות שמורות</h2>
          <p className="text-muted text-sm mb-4">
            שמור פעם אחת ארוחות שאתה אוכל קבוע — ותוסיף אותן ליום בקליק
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            ארוחה ראשונה
          </button>
        </div>
      )}

      {templates.length > 0 && (
        <>
          <button onClick={() => setCreating(true)} className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            ארוחה שמורה חדשה
          </button>

          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{t.name}</div>
                  <div className="text-xs text-muted">
                    {t.meal_type ? MEAL_LABELS[t.meal_type] : ""}
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(t.id)}
                  className="chip hover:border-accent/40"
                >
                  ערוך
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
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
        <CreateModal onCancel={() => setCreating(false)} onCreate={createTemplate} />
      )}

      {editingId && (
        <EditModal templateId={editingId} onClose={() => setEditingId(null)} />
      )}
    </div>
  );
}

function CreateModal({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string, mealType: string) => void;
}) {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<string>("breakfast");

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
          <h3 className="font-bold">ארוחה שמורה חדשה</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="label">שם הארוחה</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input mb-3"
          placeholder="למשל: הבוקר שלי"
          autoFocus
        />

        <label className="label">שייך לארוחה</label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(["breakfast", "lunch", "dinner", "snack"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={
                mealType === m
                  ? "chip-active py-2 justify-center"
                  : "chip py-2 justify-center hover:border-accent/40"
              }
            >
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>

        <button
          onClick={() => name && onCreate(name, mealType)}
          disabled={!name}
          className="btn-primary w-full"
        >
          צור והוסף מזונות
        </button>
      </div>
    </div>
  );
}

function EditModal({
  templateId,
  onClose,
}: {
  templateId: string;
  onClose: () => void;
}) {
  const [template, setTemplate] = useState<MealTemplate | null>(null);
  const [items, setItems] = useState<MealTemplateItem[]>([]);
  const [addingFood, setAddingFood] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const [{ data: t }, { data: its }] = await Promise.all([
      supabase.from("meal_templates").select("*").eq("id", templateId).maybeSingle(),
      supabase.from("meal_template_items").select("*").eq("template_id", templateId),
    ]);
    setTemplate(t);
    setItems(its ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  async function addItem(food: FoodItem, grams: number) {
    const factor = grams / 100;
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("meal_template_items")
      .insert({
        template_id: templateId,
        user_id: u.user.id,
        food_name: food.name,
        grams,
        calories: +(food.calories * factor).toFixed(1),
        protein: +(food.protein * factor).toFixed(1),
        carbs: +(food.carbs * factor).toFixed(1),
        fat: +(food.fat * factor).toFixed(1),
      })
      .select()
      .single();
    if (data) setItems([...items, data as MealTemplateItem]);
    setAddingFood(false);
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("meal_template_items").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
  }

  if (loading || !template) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
        <div className="card p-6"><div className="text-muted">טוען...</div></div>
      </div>
    );
  }

  const totals = items.reduce(
    (a, i) => ({
      cal: a.cal + (i.calories || 0),
      p: a.p + (i.protein || 0),
    }),
    { cal: 0, p: 0 }
  );

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
          <div>
            <h3 className="font-bold">{template.name}</h3>
            <p className="text-xs text-muted num">
              {Math.round(totals.cal)} קלוריות · {Math.round(totals.p)} ג' חלבון
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 mb-3">
          {items.length === 0 && (
            <div className="text-center text-xs text-muted py-4">
              אין מזונות בארוחה. הוסף כדי להתחיל.
            </div>
          )}
          {items.map((it) => (
            <div key={it.id} className="card-2 p-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{it.food_name}</div>
                <div className="text-xs text-muted num">
                  {it.grams ? `${it.grams} ג' · ` : ""}
                  {Math.round(it.calories || 0)} קלו' · {Math.round(it.protein || 0)}ג' חלבון
                </div>
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="w-8 h-8 rounded-lg hover:bg-danger/20 flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted" />
              </button>
            </div>
          ))}
        </div>

        {addingFood ? (
          <FoodPicker onPick={addItem} onCancel={() => setAddingFood(false)} />
        ) : (
          <button
            onClick={() => setAddingFood(true)}
            className="w-full card-2 p-3 flex items-center justify-center gap-2 hover:border-accent/40 transition"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span className="font-medium">הוסף מזון</span>
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

function FoodPicker({
  onPick,
  onCancel,
}: {
  onPick: (food: FoodItem, grams: number) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState<string>("");
  const results = searchFood(query);

  return (
    <div className="card-2 p-3 space-y-3">
      {!selected ? (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            placeholder="חפש מזון..."
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {results.map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  setSelected(f);
                  setGrams(String(f.commonPortion || 100));
                }}
                className="card p-2.5 w-full text-right hover:border-accent/40 transition"
              >
                <div className="font-medium text-sm">{f.name}</div>
                <div className="text-xs text-muted num">
                  {f.calories} קלו' / 100 ג'
                </div>
              </button>
            ))}
          </div>
          <button onClick={onCancel} className="btn-ghost w-full text-sm">ביטול</button>
        </>
      ) : (
        <>
          <div className="font-semibold">{selected.name}</div>
          <input
            type="number"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="input num"
            placeholder="גרמים"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => setSelected(null)} className="btn-ghost flex-1">חזור</button>
            <button
              onClick={() => onPick(selected, parseFloat(grams) || 100)}
              className="btn-primary flex-1"
            >
              הוסף
            </button>
          </div>
        </>
      )}
    </div>
  );
}

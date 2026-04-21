"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toISODate } from "@/lib/utils/date";
import { Scale, Check } from "lucide-react";

export function QuickWeightLog() {
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const w = parseFloat(weight);
    if (!w || w < 20 || w > 300) return;
    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }

    await supabase.from("weight_log").upsert(
      {
        user_id: userData.user.id,
        date: toISODate(new Date()),
        weight_kg: w,
      },
      { onConflict: "user_id,date" }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-4 h-4 text-accent" />
        <h3 className="font-semibold">שקילה יומית</h3>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          className="input flex-1 num"
          placeholder="משקל בק״ג"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button
          onClick={save}
          disabled={saving || !weight}
          className={`btn ${saved ? "bg-success text-black" : "btn-primary"}`}
        >
          {saved ? <Check className="w-4 h-4" /> : saving ? "..." : "שמור"}
        </button>
      </div>
    </section>
  );
}

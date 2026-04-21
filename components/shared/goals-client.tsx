"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import {
  calcBMR,
  calcTDEE,
  calcCalorieTarget,
  calcMacros,
  calcWaterTarget,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type ActivityLevel,
  type GoalType,
  type Sex,
} from "@/lib/utils/nutrition";
import { MUSCLE_GROUPS } from "@/lib/utils/exercises";
import { Target, Flame, Droplet, Scale, TrendingUp, Save, Check } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export function GoalsClient({
  profile,
  weightHistory,
  recentWorkouts,
}: {
  profile: Profile | null;
  weightHistory: { date: string; weight_kg: number }[];
  recentWorkouts: { date: string; muscle_group: string }[];
}) {
  const derivedAge = profile?.birth_date
    ? Math.floor(
        (Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 86400000)
      )
    : 25;

  const [sex, setSex] = useState<Sex>((profile?.sex as Sex) || "male");
  const [ageInput, setAgeInput] = useState<string>(String(derivedAge));
  const [height, setHeight] = useState<string>(String(profile?.height_cm || 175));
  const [weight, setWeight] = useState<string>(String(profile?.weight_kg || 75));
  const [activity, setActivity] = useState<ActivityLevel>(
    (profile?.activity_level as ActivityLevel) || "moderate"
  );
  const [goal, setGoal] = useState<GoalType>((profile?.goal_type as GoalType) || "maintain");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ageN = parseFloat(ageInput) || 25;
  const heightN = parseFloat(height) || 175;
  const weightN = parseFloat(weight) || 75;
  const bmr = calcBMR(sex, weightN, heightN, ageN);
  const tdee = calcTDEE(bmr, activity);
  const calTarget = calcCalorieTarget(tdee, goal);
  const macros = calcMacros(calTarget, weightN, goal);
  const waterTarget = calcWaterTarget(weightN, activity);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }

    const today = new Date();
    const birth = new Date(today.getFullYear() - ageN, today.getMonth(), today.getDate());

    await supabase
      .from("profiles")
      .update({
        sex,
        birth_date: birth.toISOString().slice(0, 10),
        height_cm: heightN,
        weight_kg: weightN,
        activity_level: activity,
        goal_type: goal,
        calorie_target: calTarget,
        protein_target: macros.protein,
        carbs_target: macros.carbs,
        fat_target: macros.fat,
        water_target_ml: waterTarget,
        updated_at: new Date().toISOString(),
      })
      .eq("id", u.user.id);

    await supabase.from("weight_log").upsert(
      {
        user_id: u.user.id,
        date: new Date().toISOString().slice(0, 10),
        weight_kg: weightN,
      },
      { onConflict: "user_id,date" }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const weightChartData = weightHistory.map((w) => ({
    date: w.date.slice(5),
    weight: Number(w.weight_kg),
  }));

  const workoutsByGroup: Record<string, number> = {};
  recentWorkouts.forEach((w) => {
    workoutsByGroup[w.muscle_group] = (workoutsByGroup[w.muscle_group] || 0) + 1;
  });
  const groupChartData = Object.entries(workoutsByGroup).map(([group, count]) => ({
    name: MUSCLE_GROUPS[group as keyof typeof MUSCLE_GROUPS] || group,
    count,
  }));

  return (
    <div className="px-4 py-4 space-y-4">
      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-bold">חישוב יעדים</h2>
        </div>
        <p className="text-xs text-muted">
          הזן את הנתונים שלך — נחשב עבורך יעדי קלוריות, חלבון ומים מותאמים אישית
        </p>

        <div>
          <label className="label">מין</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSex("male")}
              className={sex === "male" ? "chip-active py-2.5 justify-center" : "chip py-2.5 justify-center hover:border-accent/40"}
            >
              גבר
            </button>
            <button
              onClick={() => setSex("female")}
              className={sex === "female" ? "chip-active py-2.5 justify-center" : "chip py-2.5 justify-center hover:border-accent/40"}
            >
              אישה
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">גיל</label>
            <input
              type="number"
              inputMode="numeric"
              className="input num text-center"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
            />
          </div>
          <div>
            <label className="label">גובה (ס״מ)</label>
            <input
              type="number"
              inputMode="numeric"
              className="input num text-center"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div>
            <label className="label">משקל (ק״ג)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="input num text-center"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">רמת פעילות</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="input"
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABELS[a]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">מטרה</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOAL_LABELS) as GoalType[]).map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={
                  goal === g
                    ? "chip-active py-2.5 justify-center"
                    : "chip py-2.5 justify-center hover:border-accent/40"
                }
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="card-2 p-4 space-y-2">
          <div className="text-xs text-muted">היעדים שלך לפי הנתונים</div>
          <div className="grid grid-cols-2 gap-3">
            <MetricPill icon={<Flame className="w-4 h-4" />} label="קלוריות" value={`${calTarget}`} />
            <MetricPill icon={<Droplet className="w-4 h-4" />} label="מים" value={`${waterTarget} מ״ל`} />
            <MetricPill icon={<Target className="w-4 h-4" />} label="חלבון" value={`${macros.protein} ג'`} />
            <MetricPill icon={<Target className="w-4 h-4" />} label="פחמימות" value={`${macros.carbs} ג'`} />
            <MetricPill icon={<Target className="w-4 h-4" />} label="שומן" value={`${macros.fat} ג'`} />
            <MetricPill icon={<TrendingUp className="w-4 h-4" />} label="BMR" value={`${bmr}`} />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className={`w-full ${saved ? "btn bg-success text-black" : "btn-primary"}`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> נשמר!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> {saving ? "שומר..." : "שמור יעדים"}
            </>
          )}
        </button>
      </section>

      <section className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4 text-accent" />
          <h3 className="font-semibold">משקל לאורך זמן</h3>
        </div>
        {weightChartData.length >= 2 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData} margin={{ right: 8, left: -20, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(40 40 50)" />
                <XAxis dataKey="date" tick={{ fill: "#96a", fontSize: 10 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#96a", fontSize: 10 }} />
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
                  dataKey="weight"
                  stroke="rgb(255 92 53)"
                  strokeWidth={2.5}
                  dot={{ fill: "rgb(255 92 53)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-xs text-muted py-6">
            אין עדיין מספיק נתונים. שקול את עצמך יומית בעמוד הבית כדי לראות מגמה.
          </div>
        )}
      </section>

      <section className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="font-semibold">אימונים ב-30 הימים האחרונים</h3>
          <span className="chip num ms-auto">{recentWorkouts.length} אימונים</span>
        </div>
        {groupChartData.length ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupChartData} margin={{ right: 8, left: -20, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(40 40 50)" />
                <XAxis dataKey="name" tick={{ fill: "#96a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#96a", fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgb(20 20 26)",
                    border: "1px solid rgb(40 40 50)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(255,92,53,0.08)" }}
                />
                <Bar dataKey="count" fill="rgb(255 92 53)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-xs text-muted py-6">
            עדיין לא נרשמו אימונים ב-30 הימים האחרונים
          </div>
        )}
      </section>

      <section className="card p-5 bg-gradient-to-bl from-accent/10 to-transparent">
        <h3 className="font-semibold mb-3">טיפים להצלחה</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><span className="text-accent">•</span><span>שקול את עצמך כל בוקר על קיבה ריקה — כך רואים מגמה אמיתית.</span></li>
          <li className="flex gap-2"><span className="text-accent">•</span><span>רשום אימונים מיד אחרי הסט — 10 שניות עבודה, מונע שכחה.</span></li>
          <li className="flex gap-2"><span className="text-accent">•</span><span>חלבון לפני הכל — מפתח לבניית שריר ושריפת שומן.</span></li>
          <li className="flex gap-2"><span className="text-accent">•</span><span>עקביות מנצחת אינטנסיביות. 4 אימונים קצרים עדיפים על 2 ארוכים.</span></li>
          <li className="flex gap-2"><span className="text-accent">•</span><span>מים — רוב האנשים שותים פחות ממחצית ממה שהם צריכים.</span></li>
        </ul>
      </section>
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface rounded-xl p-3">
      <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted">{label}</div>
        <div className="font-bold num text-sm">{value}</div>
      </div>
    </div>
  );
}

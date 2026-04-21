// Mifflin-St Jeor equation + macro math for Hebrew fitness app

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "יושבני (ללא פעילות)",
  light: "פעילות קלה (1-3 פעמים בשבוע)",
  moderate: "פעילות בינונית (3-5 פעמים בשבוע)",
  active: "פעיל (6-7 פעמים בשבוע)",
  very_active: "פעיל מאוד (אימונים אינטנסיביים יומיים)",
};

export const GOAL_LABELS: Record<GoalType, string> = {
  lose: "ירידה במשקל",
  maintain: "שמירה על משקל",
  gain: "עלייה במסת שריר",
};

export function calcBMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  ageYears: number
) {
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calcTDEE(bmr: number, activity: ActivityLevel) {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

export function calcCalorieTarget(tdee: number, goal: GoalType) {
  if (goal === "lose") return Math.round(tdee - 500); // ~0.5kg/wk deficit
  if (goal === "gain") return Math.round(tdee + 300); // lean bulk
  return tdee;
}

export function calcMacros(
  calories: number,
  weightKg: number,
  goal: GoalType
) {
  // Protein: 1.6-2.2 g/kg depending on goal
  const proteinPerKg =
    goal === "lose" ? 2.2 : goal === "gain" ? 1.8 : 1.6;
  const protein = Math.round(weightKg * proteinPerKg);

  // Fat: 25% of calories
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remainder
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.max(0, Math.round((calories - proteinCals - fatCals) / 4));

  return { protein, fat, carbs };
}

// Water: ~35ml/kg + extra for exercise
export function calcWaterTarget(weightKg: number, activity: ActivityLevel) {
  const base = weightKg * 35;
  const extra =
    activity === "very_active"
      ? 700
      : activity === "active"
      ? 500
      : activity === "moderate"
      ? 300
      : 0;
  return Math.round((base + extra) / 100) * 100; // round to 100ml
}

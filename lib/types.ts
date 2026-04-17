export type Profile = {
  id: string;
  full_name: string | null;
  sex: "male" | "female" | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level:
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active"
    | null;
  goal_type: "lose" | "maintain" | "gain" | null;
  calorie_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  water_target_ml: number | null;
};

export type Workout = {
  id: string;
  user_id: string;
  date: string;
  muscle_group: string;
  name: string | null;
  notes: string | null;
  duration_min: number | null;
};

export type Exercise = {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  position: number;
};

export type ExerciseSet = {
  id: string;
  exercise_id: string;
  user_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
};

export type NutritionEntry = {
  id: string;
  user_id: string;
  date: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type WaterEntry = {
  id: string;
  user_id: string;
  date: string;
  ml: number;
};

export type WeightEntry = {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
};

// MET values from Compendium of Physical Activities (Ainsworth et al., 2011)
// Calories = MET × weight_kg × duration_hours

export type CardioActivity =
  | "running"
  | "walking"
  | "cycling"
  | "elliptical"
  | "swimming"
  | "rowing"
  | "hiit"
  | "stairs";

export const CARDIO_LABELS: Record<CardioActivity, string> = {
  running: "ריצה",
  walking: "הליכה",
  cycling: "אופניים",
  elliptical: "אליפטיקל",
  swimming: "שחייה",
  rowing: "חתירה",
  hiit: "HIIT",
  stairs: "מדרגות",
};

export const CARDIO_EMOJI: Record<CardioActivity, string> = {
  running: "🏃",
  walking: "🚶",
  cycling: "🚴",
  elliptical: "⚙️",
  swimming: "🏊",
  rowing: "🚣",
  hiit: "🔥",
  stairs: "🪜",
};

// MET ranges, we use a "moderate" default but boost by speed if distance given
export const CARDIO_MET: Record<CardioActivity, number> = {
  running: 9.8,    // ~10 km/h
  walking: 3.5,    // brisk walk
  cycling: 7.5,    // moderate ~20 km/h
  elliptical: 5.0,
  swimming: 8.0,
  rowing: 7.0,
  hiit: 8.0,
  stairs: 8.8,
};

export function estimateCardioCalories(params: {
  activity: CardioActivity;
  durationMin: number;
  weightKg: number;
  distanceKm?: number | null;
}): number {
  const { activity, durationMin, weightKg, distanceKm } = params;
  if (!durationMin || !weightKg) return 0;

  let met = CARDIO_MET[activity];

  // If we have distance + duration, refine MET for running/cycling/walking
  if (distanceKm && durationMin > 0) {
    const speedKmh = (distanceKm / durationMin) * 60;
    if (activity === "running") {
      // Running MET by speed: 8 km/h=8.3, 10=9.8, 12=11.5, 14=13, 16=14.8
      if (speedKmh < 8) met = 6.8;
      else if (speedKmh < 10) met = 8.3;
      else if (speedKmh < 12) met = 9.8;
      else if (speedKmh < 14) met = 11.5;
      else if (speedKmh < 16) met = 13;
      else met = 14.8;
    } else if (activity === "walking") {
      if (speedKmh < 4) met = 2.8;
      else if (speedKmh < 5.5) met = 3.5;
      else if (speedKmh < 6.5) met = 4.3;
      else met = 5.0;
    } else if (activity === "cycling") {
      if (speedKmh < 16) met = 5.0;
      else if (speedKmh < 20) met = 7.5;
      else if (speedKmh < 25) met = 10.0;
      else if (speedKmh < 30) met = 12.0;
      else met = 14.0;
    }
  }

  const hours = durationMin / 60;
  return Math.round(met * weightKg * hours);
}

export function paceFromDistanceDuration(
  distanceKm: number,
  durationMin: number
): string | null {
  if (!distanceKm || !durationMin || distanceKm <= 0) return null;
  const minPerKm = durationMin / distanceKm;
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

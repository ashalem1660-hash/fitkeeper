export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "full_body";

export const MUSCLE_GROUPS: Record<MuscleGroup, string> = {
  chest: "חזה",
  back: "גב",
  legs: "רגליים",
  shoulders: "כתפיים",
  arms: "ידיים",
  core: "בטן וליבה",
  cardio: "אירובי",
  full_body: "כל הגוף",
};

export const MUSCLE_EMOJI: Record<MuscleGroup, string> = {
  chest: "💪",
  back: "🔙",
  legs: "🦵",
  shoulders: "🏋️",
  arms: "💪",
  core: "🔥",
  cardio: "🏃",
  full_body: "⚡",
};

export interface ExerciseTemplate {
  name: string;
  group: MuscleGroup;
  unilateral?: boolean;
}

// Hebrew-first exercise library
export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  // Chest
  { name: "לחיצת חזה במוט", group: "chest" },
  { name: "לחיצת חזה בשיפוע חיובי", group: "chest" },
  { name: "לחיצת חזה בשיפוע שלילי", group: "chest" },
  { name: "לחיצת חזה במשקולות יד", group: "chest" },
  { name: "פלייז במשקולות יד", group: "chest" },
  { name: "מקבילים (Dips)", group: "chest" },
  { name: "קייבל קרוס אובר", group: "chest" },
  { name: "שכיבות סמיכה", group: "chest" },

  // Back
  { name: "מתח (Pull-ups)", group: "back" },
  { name: "דדליפט", group: "back" },
  { name: "חתירה במוט", group: "back" },
  { name: "חתירה במשקולת יד", group: "back", unilateral: true },
  { name: "פולי עליון (Lat Pulldown)", group: "back" },
  { name: "פולי תחתון (Seated Row)", group: "back" },
  { name: "היפר אקסטנשן", group: "back" },
  { name: "שראגים", group: "back" },

  // Legs
  { name: "סקוואט", group: "legs" },
  { name: "סקוואט קדמי", group: "legs" },
  { name: "הק סקוואט", group: "legs" },
  { name: "לונג׳ים", group: "legs", unilateral: true },
  { name: "לג פרס", group: "legs" },
  { name: "הרחקת ירך (מכונה)", group: "legs" },
  { name: "לג אקסטנשן", group: "legs" },
  { name: "כפיפת ברך שוכבת", group: "legs" },
  { name: "דדליפט רומני", group: "legs" },
  { name: "עליות עגל", group: "legs" },

  // Shoulders
  { name: "לחיצת כתפיים במוט", group: "shoulders" },
  { name: "לחיצת כתפיים במשקולות יד", group: "shoulders" },
  { name: "הרחקה צידית", group: "shoulders" },
  { name: "הרחקה קדמית", group: "shoulders" },
  { name: "הרחקה אחורית (Rear Delt Fly)", group: "shoulders" },
  { name: "ארנולד פרס", group: "shoulders" },
  { name: "משיכה לסנטר", group: "shoulders" },

  // Arms
  { name: "כפיפת מרפקים במוט", group: "arms" },
  { name: "כפיפת מרפקים במשקולות יד", group: "arms" },
  { name: "כפיפת פטיש", group: "arms" },
  { name: "פשיטת מרפקים בפולי", group: "arms" },
  { name: "פשיטת מרפקים בראש (French Press)", group: "arms" },
  { name: "Skullcrushers", group: "arms" },
  { name: "כפיפת מרפקים קונצנטרי", group: "arms", unilateral: true },
  { name: "סקוט פרס (דחיקה צרה)", group: "arms" },

  // Core
  { name: "פלאנק", group: "core" },
  { name: "כפיפות בטן", group: "core" },
  { name: "הרמת רגליים בתלייה", group: "core" },
  { name: "רוסיאן טוויסט", group: "core" },
  { name: "Ab Wheel", group: "core" },
  { name: "Cable Crunch", group: "core" },

  // Cardio
  { name: "ריצה במסילה", group: "cardio" },
  { name: "אופניים נייחים", group: "cardio" },
  { name: "אליפטיקל", group: "cardio" },
  { name: "חתירה (מכונת חתירה)", group: "cardio" },
  { name: "HIIT", group: "cardio" },
];

export function exercisesForGroup(g: MuscleGroup) {
  return EXERCISE_LIBRARY.filter((e) => e.group === g);
}

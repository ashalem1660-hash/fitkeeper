// Common foods per 100g (calories, protein g, carbs g, fat g)
// Curated list with Israeli/Mediterranean focus
export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  commonPortion?: number; // in grams
  portionLabel?: string;
}

export const FOOD_DATABASE: FoodItem[] = [
  // Protein sources
  { name: "חזה עוף (מבושל)", calories: 165, protein: 31, carbs: 0, fat: 3.6, commonPortion: 150, portionLabel: "מנה רגילה (150 ג')" },
  { name: "ביצה שלמה", calories: 155, protein: 13, carbs: 1.1, fat: 11, commonPortion: 50, portionLabel: "ביצה אחת (50 ג')" },
  { name: "חלבון ביצה", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, commonPortion: 33, portionLabel: "חלבון אחד (33 ג')" },
  { name: "טונה במים", calories: 116, protein: 25, carbs: 0, fat: 1, commonPortion: 140, portionLabel: "קופסה (140 ג')" },
  { name: "סלמון", calories: 208, protein: 20, carbs: 0, fat: 13, commonPortion: 150, portionLabel: "מנה (150 ג')" },
  { name: "בקר טחון 5%", calories: 137, protein: 21, carbs: 0, fat: 5, commonPortion: 150, portionLabel: "מנה (150 ג')" },
  { name: "הודו טחון", calories: 189, protein: 27, carbs: 0, fat: 8, commonPortion: 150 },
  { name: "קוטג' 5%", calories: 98, protein: 11, carbs: 3, fat: 5, commonPortion: 250, portionLabel: "גביע (250 ג')" },
  { name: "יוגורט יווני 2%", calories: 73, protein: 10, carbs: 3.6, fat: 2, commonPortion: 200 },
  { name: "אבקת חלבון (מנה)", calories: 120, protein: 24, carbs: 3, fat: 1.5, commonPortion: 30, portionLabel: "מנה (30 ג')" },
  { name: "טופו", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, commonPortion: 100 },

  // Carbs
  { name: "אורז לבן מבושל", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, commonPortion: 150 },
  { name: "אורז מלא מבושל", calories: 112, protein: 2.6, carbs: 23, fat: 0.9, commonPortion: 150 },
  { name: "פסטה מבושלת", calories: 131, protein: 5, carbs: 25, fat: 1.1, commonPortion: 150 },
  { name: "תפוח אדמה אפוי", calories: 93, protein: 2.5, carbs: 21, fat: 0.1, commonPortion: 200 },
  { name: "בטטה אפויה", calories: 90, protein: 2, carbs: 20.7, fat: 0.1, commonPortion: 200 },
  { name: "קינואה מבושלת", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, commonPortion: 150 },
  { name: "שיבולת שועל (יבשה)", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, commonPortion: 40, portionLabel: "מנה (40 ג')" },
  { name: "לחם מלא", calories: 247, protein: 13, carbs: 41, fat: 3.4, commonPortion: 30, portionLabel: "פרוסה (30 ג')" },
  { name: "פיתה", calories: 275, protein: 9, carbs: 55, fat: 1.2, commonPortion: 60, portionLabel: "פיתה (60 ג')" },
  { name: "טורטייה קמח", calories: 306, protein: 8, carbs: 50, fat: 7, commonPortion: 45 },

  // Fruits
  { name: "תפוח", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, commonPortion: 180, portionLabel: "בינוני (180 ג')" },
  { name: "בננה", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, commonPortion: 120, portionLabel: "בינונית (120 ג')" },
  { name: "אבוקדו", calories: 160, protein: 2, carbs: 9, fat: 15, commonPortion: 100, portionLabel: "חצי (100 ג')" },
  { name: "תפוז", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, commonPortion: 150 },
  { name: "תותים", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, commonPortion: 150 },
  { name: "אוכמניות", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, commonPortion: 100 },

  // Vegetables
  { name: "ברוקולי", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, commonPortion: 150 },
  { name: "מלפפון", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, commonPortion: 150 },
  { name: "עגבנייה", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, commonPortion: 120 },
  { name: "סלט ירקות", calories: 25, protein: 1.2, carbs: 5, fat: 0.2, commonPortion: 200 },
  { name: "גזר", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, commonPortion: 80 },

  // Fats
  { name: "שמן זית", calories: 884, protein: 0, carbs: 0, fat: 100, commonPortion: 15, portionLabel: "כף (15 מ\"ל)" },
  { name: "אגוזי מלך", calories: 654, protein: 15, carbs: 14, fat: 65, commonPortion: 30 },
  { name: "שקדים", calories: 579, protein: 21, carbs: 22, fat: 50, commonPortion: 30, portionLabel: "חופן (30 ג')" },
  { name: "חמאת בוטנים", calories: 588, protein: 25, carbs: 20, fat: 50, commonPortion: 30 },
  { name: "טחינה גולמית", calories: 595, protein: 17, carbs: 21, fat: 53, commonPortion: 30, portionLabel: "כף (30 ג')" },

  // Israeli classics
  { name: "חומוס", calories: 166, protein: 8, carbs: 14, fat: 9.6, commonPortion: 100 },
  { name: "סלט ישראלי", calories: 45, protein: 1.2, carbs: 5, fat: 2.5, commonPortion: 200 },
  { name: "שקשוקה", calories: 110, protein: 7, carbs: 6, fat: 7, commonPortion: 300 },
  { name: "פלאפל (כדור)", calories: 333, protein: 13, carbs: 32, fat: 18, commonPortion: 25, portionLabel: "כדור (25 ג')" },
];

export function searchFood(q: string): FoodItem[] {
  const s = q.trim();
  if (!s) return FOOD_DATABASE.slice(0, 20);
  return FOOD_DATABASE.filter((f) => f.name.includes(s)).slice(0, 30);
}

import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FALLBACKS = [
  "הגוף משיג מה שהראש מאמין שאפשר.",
  "אל תעצור כשאתה עייף. עצור כשסיימת.",
  "הסט הקשה ביותר הוא זה שגורם לך לצמוח.",
  "משמעת זה לעשות גם כשאין חשק.",
  "התקדמות קטנה כל יום = תוצאות גדולות בשנה.",
  "הגרסה הבאה שלך נבנית עכשיו.",
  "אין קיצורי דרך לשום מקום ששווה להגיע אליו.",
];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fallback = FALLBACKS[new Date().getDate() % FALLBACKS.length];

  try {
    const { name } = await req.json().catch(() => ({}));
    const today = new Date().toLocaleDateString("he-IL", { weekday: "long" });

    const text = await generateText(
      "אתה מאמן כושר ישראלי מנוסה. כותב משפטי מוטיבציה קצרים וחדים בעברית.",
      `כתוב משפט מוטיבציה קצר (עד 15 מילים) ליום ${today}${
        name ? ` עבור ${name}` : ""
      }. בלי קלישאות, בלי אימוג'ים. ישיר, חזק, אישי. החזר רק את המשפט עצמו, בלי הקדמה או גרשיים.`,
      100
    );

    return NextResponse.json({ text: text || fallback });
  } catch {
    return NextResponse.json({ text: fallback });
  }
}

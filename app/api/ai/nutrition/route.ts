import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { profile, totals } = await req.json();

    const profileSummary = profile
      ? `יעדים: ${profile.calorie_target || "?"} קלוריות, ${
          profile.protein_target || "?"
        } ג' חלבון, ${profile.carbs_target || "?"} ג' פחמימות, ${
          profile.fat_target || "?"
        } ג' שומן. מטרה: ${
          profile.goal_type === "lose"
            ? "ירידה במשקל"
            : profile.goal_type === "gain"
            ? "עלייה במסה"
            : "שמירה"
        }.`
      : "אין יעדים מוגדרים.";

    const eaten = `עד עכשיו היום אכלת: ${Math.round(
      totals.calories || 0
    )} קלוריות, ${Math.round(totals.protein || 0)} ג' חלבון, ${Math.round(
      totals.carbs || 0
    )} ג' פחמימות, ${Math.round(totals.fat || 0)} ג' שומן.`;

    const text = await generateText(
      "אתה דיאטן ספורט ישראלי. נותן המלצות מעשיות, בעברית, בלי הסתייגויות מיותרות.",
      `${profileSummary}
${eaten}

תן 3-4 המלצות ממוקדות וקצרות לשארית היום:
• מה חסר ומה עודף
• הצעות למזון ספציפי (בעברית, מזון ישראלי נפוץ)
• טיפ אחד לשיפור

כתוב בנקודות, קצר, ישיר, עד 130 מילים. בלי מידע רפואי, בלי להגיד "התייעץ עם רופא".`,
      700
    );

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({
      text: "שגיאה בטעינת ייעוץ. ודא שהגדרת יעדים בעמוד היעדים.",
    });
  }
}

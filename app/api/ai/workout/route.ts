import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/utils/exercises";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { group } = await req.json();
    const groupLabel = MUSCLE_GROUPS[group as MuscleGroup] || group;

    const raw = await generateText(
      "אתה מאמן כוח ישראלי. החזר רק JSON ללא הסברים.",
      `הצע 6 תרגילים מעולים לאימון ${groupLabel}. תרגילים מבוססים ומגוונים (מוט, משקולות יד, מכונה, משקל גוף).
החזר רק JSON במבנה: {"exercises": ["תרגיל 1", "תרגיל 2", ...]}
שמות התרגילים חייבים להיות בעברית. בלי הסברים, בלי markdown, בלי סימנים נוספים.`,
      500
    );

    // Parse JSON, tolerating a possible code fence
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let exercises: string[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.exercises)) {
        exercises = parsed.exercises.filter((x: unknown) => typeof x === "string").slice(0, 8);
      }
    } catch {
      // Fallback: split lines
      exercises = cleaned
        .split("\n")
        .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 6);
    }

    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ exercises: [] });
  }
}

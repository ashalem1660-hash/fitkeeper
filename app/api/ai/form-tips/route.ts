import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { exercise } = await req.json();
    if (!exercise) {
      return NextResponse.json({ text: "לא צוין תרגיל." });
    }

    const text = await generateText(
      "אתה מאמן כוח ופיזיותרפיסט ישראלי. כותב בעברית ברורה ומדויקת.",
      `תן טיפים לביצוע נכון של התרגיל: "${exercise}".
המבנה:
• תנוחת התחלה (1-2 נקודות)
• ביצוע נכון (2-3 נקודות)
• טעויות נפוצות (2 נקודות)
• טיפ מקצועי אחד

כתוב קצר, מעשי, עם נקודות (bullet points). בלי מידע רפואי, בלי הסתייגויות. עד 150 מילה.`,
      600
    );

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: "שגיאה בהצגת טיפים. נסה שוב." });
  }
}

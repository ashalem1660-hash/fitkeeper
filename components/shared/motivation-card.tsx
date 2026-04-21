"use client";

import { useMemo, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

const QUOTES = [
  "הגוף משיג מה שהראש מאמין שאפשר.",
  "אל תעצור כשאתה עייף. עצור כשסיימת.",
  "הסט הקשה ביותר הוא זה שגורם לך לצמוח.",
  "משמעת זה לעשות גם כשאין חשק.",
  "התקדמות קטנה כל יום שווה תוצאות גדולות בשנה.",
  "הגרסה הבאה שלך נבנית עכשיו.",
  "אין קיצורי דרך לשום מקום ששווה להגיע אליו.",
  "כוח אמיתי נבנה ברגעים שאף אחד לא רואה.",
  "כל חזרה היא שכבה עוד בגרסה הטובה של עצמך.",
  "לא צריך להיות מושלם, צריך להיות עקבי.",
  "האתגר לא שם כדי לשבור אותך. הוא שם כדי לבנות אותך.",
  "הכאב של האימון קצר. הגאווה של ההתקדמות נשארת.",
  "אתה לא מתאמן נגד מישהו אחר. אתה מתאמן נגד מי שהיית אתמול.",
  "תנוחה, נשימה, תנועה. כל השאר זה רעש.",
  "עוד סט אחד. תמיד אפשר עוד אחד.",
];

export function MotivationCard({ userName }: { userName?: string }) {
  const initial = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = Number(new Date()) - Number(start);
    const dayOfYear = Math.floor(diff / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  const [quote, setQuote] = useState(initial);

  function shuffle() {
    let next = quote;
    while (next === quote) {
      next = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
    setQuote(next);
  }

  return (
    <section className="card p-5 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-accent font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            מוטיבציה להיום{userName ? `, ${userName}` : ""}
          </div>
          <p className="text-lg font-medium leading-relaxed">{quote}</p>
        </div>
        <button
          onClick={shuffle}
          className="w-9 h-9 rounded-xl bg-surface-2 hover:bg-border flex items-center justify-center shrink-0"
          aria-label="החלף ציטוט"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

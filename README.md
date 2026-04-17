# FitKeeper — אפליקציית כושר בעברית 🏋️

אפליקציית Next.js 15 + Supabase עם תמיכה מלאה ב-RTL עברית. שני מסכים ראשיים: **אימונים בחדר כושר** (יומן שבועי עם תרגילים, סטים, משקלים) ו-**תזונה** (קלוריות, חלבון, מים, יעדים). כולל מאמן AI בעברית (מוטיבציה, רעיונות לאימון, טיפים לתרגילים, ייעוץ תזונה).

---

## ⚡ התקנה מהירה (15 דקות)

### 1. פרויקט Supabase

1. היכנס ל-[supabase.com](https://supabase.com) ולחץ **New Project**
2. בחר שם, סיסמה ל-DB, ואזור (Frankfurt מומלץ לישראל)
3. חכה ~2 דקות עד שהפרויקט יהיה מוכן
4. עבור ל-**SQL Editor** (סרגל שמאלי) → **New Query**
5. פתח את הקובץ `supabase/schema.sql` מהפרויקט → העתק הכל → הדבק ב-SQL Editor → **Run**

   אתה אמור לראות הודעת הצלחה. זה יוצר 7 טבלאות, RLS policies, וטריגר ליצירת פרופיל אוטומטי.

6. עבור ל-**Settings → API** וסמן לעצמך שני ערכים:
   - `Project URL`
   - `anon public key` (תחת Project API keys)

### 2. מפתח Anthropic

1. היכנס ל-[console.anthropic.com](https://console.anthropic.com)
2. **API Keys → Create Key** → העתק את המפתח (מתחיל ב-`sk-ant-...`)

### 3. הרצה מקומית

```bash
# התקנה
npm install

# צור קובץ סביבה
cp .env.local.example .env.local
# ערוך .env.local והכנס את 3 הערכים מהשלבים למעלה

# הפעל
npm run dev
```

פתח http://localhost:3000 — צור חשבון, אשר מייל (או כבה אימות מייל בשלב הבא), והתחיל.

### 4. כיבוי אימות מייל (לבדיקה מהירה)

ברירת המחדל של Supabase דורשת אישור מייל. לפיתוח:
- **Authentication → Providers → Email** → כבה `Confirm email` → Save

בייצור מומלץ להשאיר פעיל.

---

## 🚀 דיפלוי ל-Vercel

1. דחוף את הקוד ל-GitHub (רפוזיטורי חדש):
   ```bash
   git init
   git add .
   git commit -m "Initial"
   git remote add origin <YOUR_REPO_URL>
   git push -u origin main
   ```

2. היכנס ל-[vercel.com](https://vercel.com) → **Add New → Project** → בחר את הרפו.
3. ב-**Environment Variables** הכנס את 3 הערכים מ-`.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. **Deploy**. תוך ~2 דקות האפליקציה חיה.
5. לאחר הדיפלוי, עבור ב-Supabase ל-**Authentication → URL Configuration**:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: הוסף `https://your-app.vercel.app/**`

---

## 🗂 מבנה הפרויקט

```
app/
├── page.tsx              דף נחיתה
├── layout.tsx            RTL + פונטים עבריים (Heebo + Rubik)
├── globals.css           נושא כהה עם אקצנט כתום
├── auth/                 התחברות / הרשמה / אישור
├── dashboard/            עמוד בית — סיכום יומי + מוטיבציה
├── gym/                  יומן אימונים שבועי
├── nutrition/            מעקב תזונה יומי
├── goals/                הגדרת יעדים + גרפים
└── api/ai/               4 routes של Claude (motivation, workout, form-tips, nutrition)

components/
├── shared/               רכיבים משותפים (nav, top-bar, וכו')
├── gym/                  רכיבי אימון
└── nutrition/            רכיבי תזונה

lib/
├── supabase/             Client, Server, Middleware
├── utils/
│   ├── date.ts           עזרי תאריך עברי (שבוע ראשון-שבת)
│   ├── exercises.ts      ~50 תרגילים ב-8 קבוצות שרירים
│   ├── foods.ts          ~40 מאכלים ישראליים עם מאקרו
│   ├── nutrition.ts      חישוב BMR/TDEE/מאקרו
│   └── cn.ts
├── ai/claude.ts          Wrapper ל-Anthropic SDK
└── types.ts              טיפוסי DB

supabase/
└── schema.sql            סכמה מלאה להדבקה ב-SQL Editor
```

---

## 🎨 עיצוב

- **RTL מלא** מוגדר ב-`<html dir="rtl" lang="he">`
- **נושא כהה**: רקע `#0c0c10`, אקצנט כתום `#ff5c35`, אקצנט-2 ענברי
- **פונטים עבריים**: Heebo (גוף), Rubik (כותרות) — נטענים מ-Google Fonts
- **Mobile-first**: מקסימום רוחב `max-w-lg`, ניווט תחתון קבוע, `safe-area-inset`
- **Recharts** לגרפים (משקל, התפלגות אימונים)

---

## 🤖 תכונות AI

כל הקריאות ל-API עוברות דרך Next.js API routes (server-side) — המפתח של Anthropic אף פעם לא נחשף לדפדפן.

המודל בשימוש: **Claude Haiku 4.5** — מהיר וזול (< $0.01 לקריאה).

| תכונה | נתיב | מה עושה |
|---|---|---|
| מוטיבציה יומית | `/api/ai/motivation` | משפט קצר בעברית, מוטמן ל-sessionStorage ליום |
| רעיונות לתרגילים | `/api/ai/workout` | 6 תרגילים מותאמים לקבוצת שרירים |
| טיפי תרגיל | `/api/ai/form-tips` | הסבר ביצוע + טעויות נפוצות |
| ייעוץ תזונה | `/api/ai/nutrition` | המלצות אישיות לפי מה שנאכל עד כה |

לכל route יש fallback — אם אין מפתח Anthropic או שהקריאה נכשלה, המשתמש רואה תוכן ברירת מחדל ולא שגיאה.

---

## 🔒 אבטחה

- **RLS מופעל על כל הטבלאות**: כל משתמש רואה רק את הנתונים שלו.
- **Middleware** מרענן טוקנים אוטומטית ומפנה למסך התחברות.
- **שורש `/`**: משתמש מחובר מופנה ל-`/dashboard`, לא מחובר רואה נחיתה.
- כל route של `/api/ai/*` בודק auth לפני שליחת קריאה ל-Claude (מונע bill abuse).

---

## 🔧 הרחבות מומלצות (אחרי שהאפליקציה חיה)

- **PWA**: הוסף `manifest.json` ו-service worker כדי שאפשר יהיה להתקין כאפליקציה במסך הבית
- **חיפוש מזון מ-API חיצוני**: הרחב את `lib/utils/foods.ts` לחבור ל-OpenFoodFacts או Edamam
- **תמונות לתרגילים**: אחסן ב-Supabase Storage, הוסף `image_url` ל-`exercises`
- **העתקת אימון קודם**: כפתור "חזור על אימון אחרון של חזה" ב-gym-client
- **ייצוא ל-CSV**: לייצא היסטוריית אימונים
- **Streaks**: ספור ימים רצופים של לוג תזונה / אימון

---

## ❓ בעיות נפוצות

**"Invalid login credentials"** — או שהסיסמה לא נכונה, או שלא אישרת מייל. בדוק את תיבת המייל או כבה אימות מייל ב-Supabase.

**"JSON object requested, multiple (or no) rows returned"** — לרוב בגלל שהפרופיל לא נוצר. ודא שהטריגר `on_auth_user_created` רץ בהצלחה בעת הרצת ה-SQL.

**הגרפים לא מופיעים** — Recharts דורש לפחות 2 נקודות נתונים. שקול את עצמך יומית (דרך הדשבורד) למשך יומיים.

**AI לא עובד** — ודא ש-`ANTHROPIC_API_KEY` מוגדר ב-Vercel (Settings → Environment Variables) וש-redeploy בוצע אחרי ההוספה.

---

**Built with Next.js 15, React 19, Supabase, Tailwind, Anthropic SDK, Recharts.**

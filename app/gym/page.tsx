import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { GymClient } from "@/components/gym/gym-client";
import { toISODate, getWeekRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function GymPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const refDate = sp.date ? new Date(sp.date + "T00:00:00") : new Date();
  const { start, end } = getWeekRange(refDate);

  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("id, date, muscle_group, name")
    .eq("user_id", user.id)
    .gte("date", toISODate(start))
    .lte("date", toISODate(end))
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <TopBar title="אימון" subtitle="נהל את שגרת הכושר שלך" />
      <GymClient initialDate={toISODate(refDate)} weekWorkouts={weekWorkouts ?? []} />
    </AppShell>
  );
}

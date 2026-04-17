import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { GoalsClient } from "@/components/shared/goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: weightHistory }, { data: recentWorkouts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("weight_log")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .limit(90),
    supabase
      .from("workouts")
      .select("id, date, muscle_group")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
      .order("date", { ascending: true }),
  ]);

  return (
    <AppShell>
      <TopBar title="יעדים והתקדמות" subtitle="הגדר מטרות וצפה בהתקדמות" />
      <GoalsClient
        profile={profile}
        weightHistory={weightHistory ?? []}
        recentWorkouts={recentWorkouts ?? []}
      />
    </AppShell>
  );
}

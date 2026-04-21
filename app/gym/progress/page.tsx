import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { ProgressClient } from "@/components/gym/progress-client";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get distinct exercise names the user has trained
  const { data: exercisesData } = await supabase
    .from("workout_exercises")
    .select("name")
    .eq("user_id", user.id);

  const uniqueNames = Array.from(
    new Set((exercisesData ?? []).map((e) => e.name))
  ).sort();

  return (
    <AppShell>
      <TopBar title="התקדמות" subtitle="גרף לכל תרגיל + תובנות" />
      <ProgressClient exerciseNames={uniqueNames} userId={user.id} />
    </AppShell>
  );
}

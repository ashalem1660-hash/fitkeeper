import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { NutritionClient } from "@/components/nutrition/nutrition-client";
import { toISODate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function NutritionPage({
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

  const date = sp.date || toISODate(new Date());

  const [{ data: profile }, { data: meals }, { data: water }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("created_at", { ascending: true }),
    supabase.from("water_log").select("*").eq("user_id", user.id).eq("date", date),
  ]);

  return (
    <AppShell>
      <TopBar title="תזונה" subtitle="קלוריות, חלבון ומים" />
      <NutritionClient
        initialDate={date}
        profile={profile}
        initialMeals={meals ?? []}
        initialWater={water ?? []}
      />
    </AppShell>
  );
}

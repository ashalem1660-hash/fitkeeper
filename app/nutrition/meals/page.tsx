import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { MealTemplatesClient } from "@/components/nutrition/meal-templates-client";

export const dynamic = "force-dynamic";

export default async function MealTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: templates } = await supabase
    .from("meal_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <TopBar title="ארוחות שמורות" subtitle="בנה ארוחה פעם אחת, הוסף ביום בקליק" />
      <MealTemplatesClient initialTemplates={templates ?? []} />
    </AppShell>
  );
}

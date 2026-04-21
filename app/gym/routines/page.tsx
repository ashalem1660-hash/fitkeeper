import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { RoutinesClient } from "@/components/gym/routines-client";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: routines } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <TopBar title="תבניות אימון" subtitle="שגרה מוכנה שחוזרת על עצמה" />
      <RoutinesClient initialRoutines={routines ?? []} />
    </AppShell>
  );
}

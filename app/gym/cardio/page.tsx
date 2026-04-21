import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { TopBar } from "@/components/shared/top-bar";
import { CardioClient } from "@/components/gym/cardio-client";
import { toISODate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function CardioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: recent }] = await Promise.all([
    supabase.from("profiles").select("weight_kg").eq("id", user.id).maybeSingle(),
    supabase
      .from("cardio_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <AppShell>
      <TopBar title="אירובי" subtitle="ריצה, אופניים, שחייה ועוד" />
      <CardioClient
        today={toISODate(new Date())}
        weightKg={profile?.weight_kg ?? 75}
        initialSessions={recent ?? []}
      />
    </AppShell>
  );
}

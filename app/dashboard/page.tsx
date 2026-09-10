import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth");

  const [{ data: bars }, { data: memberships }, query] = await Promise.all([
    supabase.from("bars").select("id,name,city").order("city").order("name"),
    supabase.from("game_players").select("game_id").eq("user_id", userId).eq("active", true),
    searchParams,
  ]);

  let activeCode: string | null = null;
  const gameIds = (memberships ?? []).map((row: { game_id: number }) => row.game_id);
  if (gameIds.length) {
    const { data: activeGames } = await supabase
      .from("games")
      .select("id,code,status,created_at")
      .in("id", gameIds)
      .neq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(1);
    activeCode = activeGames?.[0]?.code ?? null;
  }

  return <DashboardClient bars={(bars ?? []) as any} activeCode={activeCode} error={query.error} />;
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WheelClient from "@/components/WheelClient";
import MobileTopBar from "@/components/MobileTopBar";

export default async function WheelPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/auth");

  const { data: game } = await supabase.from("games").select("id,code,status,current_hole").eq("code", code.toUpperCase()).single();
  if (!game) notFound();
  if (game.status !== "active") redirect(`/game/${game.code}`);

  const [{ data: hole }, { data: challenges }] = await Promise.all([
    supabase.from("game_holes").select("wheel_enabled").eq("game_id", game.id).eq("hole_number", game.current_hole).single(),
    supabase.from("wheel_challenges").select("id,emoji,title,description,success_delta,fail_delta").eq("active", true).order("id"),
  ]);

  if (!hole?.wheel_enabled) redirect(`/game/${game.code}`);

  const { data: assignmentRows } = await supabase.rpc("assign_wheel_for_hole", {
    p_game_id: game.id,
    p_hole_number: game.current_hole,
  });
  const assignment = Array.isArray(assignmentRows) ? assignmentRows[0] : assignmentRows;
  if (!assignment || assignment.status !== "assigned") redirect(`/game/${game.code}`);

  return (
    <main className="wheel-screen old-page">
      <MobileTopBar showBack backHref={`/game/${game.code}`} />
      <WheelClient gameId={game.id} code={game.code} hole={game.current_hole} challenges={challenges ?? []} />
    </main>
  );
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function startGame(formData: FormData) {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").toUpperCase();
  const { data: game } = await supabase.from("games").select("id").eq("code", code).single();
  if (!game) redirect("/dashboard");
  const { error } = await supabase.from("games").update({ status: "active" }).eq("id", game.id);
  if (error) redirect(`/game/${code}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/game/${code}`);
}

export async function leaveGame(formData: FormData) {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").toUpperCase();
  const { error } = await supabase.rpc("leave_game", { p_code: code });
  if (error) redirect(`/game/${code}?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function saveScore(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  const code = String(formData.get("code") ?? "").toUpperCase();
  const hole = Number(formData.get("hole") ?? 0);
  const score = Math.min(30, Math.max(1, Number(formData.get("score") ?? 1)));
  if (!userId) redirect("/auth");

  const { data: game } = await supabase.from("games").select("id").eq("code", code).single();
  if (!game) redirect("/dashboard");

  const { error } = await supabase.from("results").upsert({
    game_id: game.id,
    hole_number: hole,
    user_id: userId,
    score,
    confirmed: true,
  }, { onConflict: "game_id,hole_number,user_id" });

  if (error) redirect(`/game/${code}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/game/${code}`);
}

export async function advanceHole(formData: FormData) {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").toUpperCase();
  const { data: game } = await supabase.from("games").select("id,current_hole,holes").eq("code", code).single();
  if (!game) redirect("/dashboard");

  const [{ count: playerCount }, { count: confirmedCount }] = await Promise.all([
    supabase.from("game_players").select("*", { count: "exact", head: true }).eq("game_id", game.id).eq("active", true),
    supabase.from("results").select("*", { count: "exact", head: true }).eq("game_id", game.id).eq("hole_number", game.current_hole).eq("confirmed", true),
  ]);

  if ((confirmedCount ?? 0) < (playerCount ?? 0)) {
    redirect(`/game/${code}?error=${encodeURIComponent("Alla spelare måste bekräfta sin poäng först")}`);
  }

  const update = game.current_hole >= game.holes
    ? { status: "finished" as const }
    : { current_hole: game.current_hole + 1 };
  const { error } = await supabase.from("games").update(update).eq("id", game.id);
  if (error) redirect(`/game/${code}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/game/${code}`);
  if (game.current_hole >= game.holes) redirect(`/game/${code}`);
}

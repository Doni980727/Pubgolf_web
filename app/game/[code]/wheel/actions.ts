"use server";

import { createClient } from "@/lib/supabase/server";

export async function revealWheel(gameId: number, hole: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_my_wheel_assignment", {
    p_game_id: gameId,
    p_hole_number: hole,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function resolveWheel(gameId: number, hole: number, completed: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_my_wheel_assignment", {
    p_game_id: gameId,
    p_hole_number: hole,
    p_completed: completed,
  });
  if (error) throw new Error(error.message);
  return data;
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function createGame(formData: FormData) {
  const supabase = await createClient();
  const city = String(formData.get("city") ?? "").trim();
  const holes = Number(formData.get("holes") ?? 0);
  const startPub = Number(formData.get("startPub") ?? 0);
  const wheelCount = Number(formData.get("wheelCount") ?? 0);
  const wheelMode = String(formData.get("wheelMode") ?? "random");

  if (!city || !Number.isInteger(holes) || holes < 1 || !Number.isInteger(startPub)) {
    redirect(`/dashboard?error=${encodeURIComponent("Ogiltiga spelinställningar")}`);
  }

  const { data: bars, error: barsError } = await supabase.from("bars").select("id").eq("city", city);
  if (barsError) redirect(`/dashboard?error=${encodeURIComponent(barsError.message)}`);

  const ids = (bars ?? []).map((bar: { id: number }) => Number(bar.id));
  if (!ids.includes(startPub)) redirect(`/dashboard?error=${encodeURIComponent("Startpuben finns inte i vald stad")}`);
  if (holes > ids.length) redirect(`/dashboard?error=${encodeURIComponent(`Det finns bara ${ids.length} pubar i ${city}`)}`);

  const remaining = shuffle(ids.filter((id) => id !== startPub));
  const barIds = [startPub, ...remaining].slice(0, holes);

  const { data, error } = await supabase.rpc("create_game", {
    p_bar_ids: barIds,
    p_wheel_count: Math.min(Math.max(wheelCount, 0), holes),
    p_wheel_mode: wheelMode,
    p_random_min: 1,
    p_random_max: 3,
  });

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  const created = Array.isArray(data) ? data[0] : data;
  redirect(`/game/${created.code}`);
}

export async function joinGame(formData: FormData) {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const { error } = await supabase.rpc("join_game", { p_code: code });
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  redirect(`/game/${code}`);
}

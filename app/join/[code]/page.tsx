import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function JoinByLink({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();

  if (!auth?.claims?.sub) {
    redirect(`/auth?next=${encodeURIComponent(`/join/${code}`)}`);
  }

  const { error } = await supabase.rpc("join_game", { p_code: code });
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  redirect(`/game/${code}`);
}

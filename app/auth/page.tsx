import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthScreen from "@/components/AuthScreen";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const query = await searchParams;
  if (data?.claims?.sub) redirect(query.next?.startsWith("/") ? query.next : "/dashboard");
  return <AuthScreen error={query.error} message={query.message} next={query.next} />;
}

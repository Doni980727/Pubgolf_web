"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const requestHeaders = await headers();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const next = safeNext(formData.get("next"));
  const requestOrigin = requestHeaders.get("origin");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || requestOrigin || "http://localhost:3000").replace(/\/$/, "");
  const emailRedirectTo = `${siteUrl}/auth/confirm?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo },
  });
  if (error) redirect(`/auth?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  if (data.session) redirect(next);
  redirect(`/auth?message=${encodeURIComponent("Konto skapat! Bekräfta länken i mejlet och logga sedan in.")}&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

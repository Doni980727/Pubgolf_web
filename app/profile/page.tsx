import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileTopBar from "@/components/MobileTopBar";
import AppLogo from "@/components/AppLogo";
import { signOut } from "@/app/auth/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth");
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).single();

  return (
    <main className="old-page profile-screen">
      <MobileTopBar showBack />
      <section className="simple-screen-content profile-content">
        <AppLogo size={100} />
        <h1>{profile?.username ?? "Spelare"}</h1>
        <form action={signOut}><button className="lobby-button leave" type="submit">Logga ut</button></form>
      </section>
    </main>
  );
}

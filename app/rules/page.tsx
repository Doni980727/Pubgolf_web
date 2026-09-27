import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileTopBar from "@/components/MobileTopBar";
import RulesContent from "@/components/RulesContent";

export default async function RulesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/auth");
  return (
    <main className="old-page rules-screen">
      <MobileTopBar showBack />
      <section className="simple-screen-content">
        <h1>Regler</h1>
        <RulesContent />
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileTopBar from "@/components/MobileTopBar";

export default async function RulesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/auth");
  return (
    <main className="old-page rules-screen">
      <MobileTopBar showBack />
      <section className="simple-screen-content">
        <h1>Regler</h1>
        <div className="old-card rules-card">
          <p>Varje pub är ett hål. Drick enligt den dryck och det par som gruppen bestämt.</p>
          <p>Din poäng är antalet klunkar/slag enligt era regler. Lägst totalpoäng vinner.</p>
          <p>På Wheel of Doom-hål kan en eller flera spelare få en utmaning beroende på valt spelläge.</p>
          <p>Utmaningar bygger på gentleman’s agreement: gruppen avgör om de är genomförda.</p>
        </div>
      </section>
    </main>
  );
}

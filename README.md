# PubGolf Web

Mobil-först webversion av den ursprungliga Expo/React Native-appen **Pubgolf**.

Målet är att sidan ska kännas som den gamla appen när den öppnas i mobilen, men utan App Store eller Google Play. Projektet använder Next.js + Supabase och kan senare deployas till t.ex. Vercel/Cloudflare.

## Vad som finns i den här versionen

- Samma mörkbruna/orange färgtema som originalappen.
- Mobil layout med safe-area för iPhone/Android.
- Inloggning och registrering i samma typ av helskärmsvy som gamla appen.
- Startsida med **PubGolf 🍻 / Redo att spela? / Spela**.
- Skapa spel / gå med i spel som modaler i stället för desktop-dashboardkort.
- Skapa spel med stad, antal hål, startpub, antal Wheel-hål och läge.
- Lobby med spelkod, delbar webblänk, spelarlista och host-start.
- Aktivt spel med pubinfo, hålindikator, leaderboard och egen poängkontroll.
- Wheel of Doom i originalets visuella stil, men med serverstyrd Supabase-logik.
- Classic / Everyone / Random.
- Direktlänk `/join/KOD123` som automatiskt ansluter spelaren efter inloggning.
- Enkel PWA-manifest så sidan kan öppnas mer app-likt från hemskärmen.
- Inga shaders. Bakgrundskänslan återskapas med CSS-gradienter/animation i stället.

## 1. Installera

```bash
npm install
```

Skapa `.env.local` från `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://DIN-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Starta:

```bash
npm run dev
```

Öppna `http://localhost:3000`.

## 2. Supabase

### Nytt Supabase-projekt

Kör hela:

```text
supabase/migrations/001_initial.sql
```

i Supabase SQL Editor.

Den skapar tabeller, RLS, RPC-funktioner, Wheel-logik och Umeå-pubarna som fanns refererade i originalappen.

### Om du redan körde den tidigare starter-migrationen

Kör även:

```text
supabase/migrations/002_mobile_web_update.sql
```

Den lägger till originalets pubnamn utan att ta bort befintliga poster och lägger till funktionen för att lämna en lobby korrekt.

Kör därefter:

```text
supabase/migrations/003_pub_coordinates.sql
```

Den lägger till koordinater för de förinstallerade Umeå-pubarna, vilket används av ruttlägena Smart slump och Närmaste rutt.

För Custom game, kör även:

```text
supabase/migrations/004_custom_games.sql
```

Den låter ett spel använda tillfälliga namn och adresser som stationer. Adresserna rensas automatiskt när spelet avslutas.

Kör slutligen:

```text
supabase/migrations/005_custom_route_optimization.sql
```

Den lägger till tillfälliga koordinater för automatisk optimering av custom-rutter.

## Mobilanvändning

Sidan är byggd mobile-first och använder `100dvh`, `viewport-fit=cover` samt `safe-area-inset-*`. På desktop visas appen i ungefär mobilbredd i mitten för att beteendet ska vara lätt att testa.

När sidan deployats kan en användare bara öppna URL:en i Safari/Chrome. En spellänk kan delas direkt från lobbyn. På mobiler som stöder det används webbläsarens native Share-dialog.

## Viktigt om logotypen

För att matcha gamla appen laddas `icon_pubgolf.png` för närvarande direkt från det publika GitHub-repot. När vi gör deployment-versionen bör vi lägga en lokal kopia i `public/` så appen inte är beroende av GitHub för logotypen.

## Nästa steg

Det som främst återstår för att matcha originalappen funktionellt är:

- riktiga drinkar per pub + par/pris/storlek,
- pubbilder,
- historik/resultatsida fullt ut,
- hostens score-justering,
- profil/redigering,
- lösenordsåterställning,
- mer komplett realtime i stället för enkel polling,
- deployment/PWA-ikoner.

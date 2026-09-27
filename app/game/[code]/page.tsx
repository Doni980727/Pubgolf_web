import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileTopBar from "@/components/MobileTopBar";
import AutoRefresh from "@/components/AutoRefresh";
import ShareGameButton from "@/components/ShareGameButton";
import ScoreControl from "@/components/ScoreControl";
import GameQrCode from "@/components/GameQrCode";
import { advanceHole, leaveGame, startGame } from "./actions";

type PlayerRow = { user_id: string; username: string | null; joined_at: string };
type ResultRow = { user_id: string; hole_number: number; score: number; confirmed: boolean };
type WheelRow = { user_id: string; hole_number: number; score_delta: number; status: string };

export default async function GamePage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ error?: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const query = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth");

  const { data: game } = await supabase
    .from("games")
    .select("id,code,status,current_hole,holes,wheel_mode,host_id,wheel_count")
    .eq("code", code)
    .single();
  if (!game) notFound();

  const [{ data: players }, { data: holes }, { data: results }, { data: wheelRows }] = await Promise.all([
    supabase.from("game_player_list").select("user_id,username,joined_at").eq("game_id", game.id).order("joined_at"),
    supabase.from("game_holes").select("hole_number,wheel_enabled,bar_id,custom_name,custom_address,bars(name,city)").eq("game_id", game.id).order("hole_number"),
    supabase.from("results").select("user_id,hole_number,score,confirmed").eq("game_id", game.id),
    supabase.from("wheel_assignments").select("user_id,hole_number,score_delta,status").eq("game_id", game.id),
  ]);

  const playerList = (players ?? []) as PlayerRow[];
  const resultList = (results ?? []) as ResultRow[];
  const wheelList = (wheelRows ?? []) as WheelRow[];
  const holeList = (holes ?? []) as any[];
  const currentHole = holeList.find((h) => Number(h.hole_number) === Number(game.current_hole));
  const linkedBar = Array.isArray(currentHole?.bars) ? currentHole?.bars?.[0] : currentHole?.bars;
  const currentBar = linkedBar ?? (currentHole?.custom_name ? { name: currentHole.custom_name, address: currentHole.custom_address } : null);

  if (game.status === "active" && currentHole?.wheel_enabled) {
    const { data: myWheelRows } = await supabase.rpc("assign_wheel_for_hole", {
      p_game_id: game.id,
      p_hole_number: game.current_hole,
    });
    const myWheel = Array.isArray(myWheelRows) ? myWheelRows[0] : myWheelRows;
    if (myWheel?.status === "assigned") redirect(`/game/${game.code}/wheel`);
  }

  const me = playerList.find((player) => player.user_id === userId);
  const myResult = resultList.find((r) => r.user_id === userId && Number(r.hole_number) === Number(game.current_hole));

  const leaderboard = playerList.map((player) => {
    const confirmed = resultList.filter((r) => r.user_id === player.user_id && r.confirmed && r.hole_number <= game.current_hole);
    const wheelDelta = wheelList.filter((row) => row.user_id === player.user_id && row.hole_number <= game.current_hole && row.status !== "assigned").reduce((sum, row) => sum + Number(row.score_delta || 0), 0);
    const total = confirmed.reduce((sum, row) => sum + Number(row.score || 0), 0) + wheelDelta;
    const thisHole = resultList.find((r) => r.user_id === player.user_id && Number(r.hole_number) === Number(game.current_hole));
    return { ...player, total, thisHole };
  }).sort((a, b) => a.total - b.total || (a.username ?? "").localeCompare(b.username ?? ""));

  const confirmedThisHole = resultList.filter((r) => Number(r.hole_number) === Number(game.current_hole) && r.confirmed).length;
  const allConfirmed = playerList.length > 0 && confirmedThisHole >= playerList.length;

  if (game.status === "lobby") {
    const firstHole = holeList[0];
    const linkedFirstBar = Array.isArray(firstHole?.bars) ? firstHole?.bars?.[0] : firstHole?.bars;
    const firstBar = linkedFirstBar ?? (firstHole?.custom_name ? { name: firstHole.custom_name } : null);
    return (
      <main className="lobby-screen old-page">
        <MobileTopBar showBack backHref="/dashboard" />
        <AutoRefresh interval={2200} />
        <section className="lobby-content">
          {query.error ? <p className="form-error lobby-error">{query.error}</p> : null}
          <p className="lobby-summary">Startpub: {firstBar?.name ?? "–"} &nbsp;&nbsp; Antal hål: {game.holes}</p>

          <div className="share-code-card">
            <span>Spelkod</span>
            <strong>{game.code}</strong>
            <p>Skanna QR-koden eller skicka koden eller länken till de andra spelarna.</p>
            <GameQrCode code={game.code} />
            <ShareGameButton code={game.code} />
          </div>

          <section className="lobby-players-card">
            <h2>Spelare:</h2>
            <div className="lobby-player-list">
              {playerList.map((player) => <p key={player.user_id}>- {player.username ?? "Spelare"}</p>)}
            </div>
            <strong className="player-count">Antal spelare: {playerList.length}</strong>
          </section>

          <div className="lobby-actions">
            <form action={leaveGame}>
              <input type="hidden" name="code" value={game.code} />
              <button className="lobby-button leave" type="submit">Lämna lobby</button>
            </form>
            {game.host_id === userId ? (
              <form action={startGame}>
                <input type="hidden" name="code" value={game.code} />
                <button className="lobby-button start" type="submit">Starta spel</button>
              </form>
            ) : <p className="waiting-host">Väntar på att hosten startar spelet…</p>}
          </div>
        </section>
      </main>
    );
  }

  if (game.status === "finished") {
    return (
      <main className="result-screen animated-bg">
        <MobileTopBar showBack backHref="/dashboard" />
        <section className="results-content">
          <h1>Resultat</h1>
          <div className="results-table">
            {leaderboard.map((player, index) => (
              <div className="result-row" key={player.user_id}>
                <span>{index + 1}</span><strong>{player.username ?? "Spelare"}</strong><b>{player.total}</b>
              </div>
            ))}
          </div>
          <Link className="old-button" href="/dashboard">Till startsidan</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="game-screen old-page">
      <MobileTopBar showBack backHref="/dashboard" />
      <AutoRefresh interval={3500} />
      <section className="game-content">
        {query.error ? <p className="form-error game-error">{query.error}</p> : null}

        <div className="game-bar-title">
          <span>Hål {game.current_hole} / {game.holes}</span>
          <h1>{currentBar?.name ?? "Nästa pub"}</h1>
        </div>

        <section className="bar-info-card">
          <div>
            <p>{currentHole?.custom_name ? "Adress" : "Stad"}: {currentHole?.custom_name ? currentBar?.address : currentBar?.city ?? "–"}</p>
            <p>Wheel of Doom: {currentHole?.wheel_enabled ? "Ja" : "Nej"}</p>
            <p>Spelläge: {game.wheel_mode === "classic" ? "Classic" : game.wheel_mode === "everyone" ? "Everyone" : "Random"}</p>
          </div>
          <div className="bar-placeholder" aria-hidden="true">🍺</div>
        </section>

        {currentHole?.custom_address ? (
          <a className="directions-button" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentHole.custom_address)}`} target="_blank" rel="noreferrer">Öppna vägbeskrivning</a>
        ) : null}

        <div className="hole-tracker" aria-label="Hål">
          {holeList.map((hole) => {
            const number = Number(hole.hole_number);
            const current = number === Number(game.current_hole);
            return <span className={`hole-dot ${current ? "current" : ""} ${number < game.current_hole ? "past" : ""}`} key={number}>{number}</span>;
          })}
        </div>

        <section className="score-list">
          {leaderboard.filter((player) => player.user_id !== userId).map((player, index) => (
            <article className="other-player" key={player.user_id}>
              <span className="position">{leaderboard.findIndex((p) => p.user_id === player.user_id) + 1}</span>
              <div className="player-name-score"><strong>{player.username ?? "Spelare"}</strong><small>{player.total}</small></div>
              <span className={`hole-score ${player.thisHole?.confirmed ? "confirmed" : ""}`}>{player.thisHole?.confirmed ? player.thisHole.score : "–"}</span>
            </article>
          ))}
        </section>
      </section>

      <section className="my-player-dock">
        <article className="my-player-row">
          <span className="position">{Math.max(1, leaderboard.findIndex((p) => p.user_id === userId) + 1)}</span>
          <div className="player-name-score"><strong>{me?.username ?? "Du"}</strong><small>{leaderboard.find((p) => p.user_id === userId)?.total ?? 0}</small></div>
          <ScoreControl code={game.code} hole={game.current_hole} initialScore={myResult?.score ?? 1} confirmed={Boolean(myResult?.confirmed)} />
        </article>
        {game.host_id === userId ? (
          <form action={advanceHole} className="host-next-form">
            <input type="hidden" name="code" value={game.code} />
            <button className="confirm-score-button host-next" type="submit" disabled={!allConfirmed}>
              {game.current_hole >= game.holes ? "Avsluta spel" : "Nästa hål"}
            </button>
            {!allConfirmed ? <small>{confirmedThisHole}/{playerList.length} har bekräftat</small> : null}
          </form>
        ) : null}
      </section>
    </main>
  );
}

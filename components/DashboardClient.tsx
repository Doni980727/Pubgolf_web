"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createGame, joinGame } from "@/app/dashboard/actions";
import MobileTopBar from "@/components/MobileTopBar";

type Bar = { id: number; name: string; city: string };
type Modal = null | "play" | "create" | "join";

export default function DashboardClient({ bars, activeCode, error }: { bars: Bar[]; activeCode?: string | null; error?: string }) {
  const [modal, setModal] = useState<Modal>(null);
  const cities = useMemo(() => Array.from(new Set(bars.map((bar) => bar.city))).sort(), [bars]);
  const [city, setCity] = useState(cities[0] ?? "");
  const cityBars = bars.filter((bar) => bar.city === city);
  const maxHoles = Math.max(cityBars.length, 1);
  const holeOptions = [3, 5, 9, 18].filter((n) => n <= maxHoles);
  if (holeOptions.length === 0) holeOptions.push(maxHoles);
  const [holes, setHoles] = useState(holeOptions[0] ?? 1);

  useEffect(() => {
    const available = [3, 5, 9, 18].filter((n) => n <= Math.max(cityBars.length, 1));
    const next = available[0] ?? Math.max(cityBars.length, 1);
    if (holes > Math.max(cityBars.length, 1) || !available.includes(holes)) setHoles(next);
  }, [city, cityBars.length, holes]);

  function openPlay() {
    if (activeCode) return;
    setModal("play");
  }

  return (
    <main className="home-screen animated-bg">
      <MobileTopBar />
      <section className="home-content">
        <h1>PubGolf 🍻</h1>
        <p>Redo att spela?</p>
        {activeCode ? (
          <Link className="old-button home-play" href={`/game/${activeCode}`}>Fortsätt spela</Link>
        ) : (
          <button className="old-button home-play" type="button" onClick={openPlay}>Spela</button>
        )}
        {error ? <p className="home-error">{error}</p> : null}
      </section>

      {modal ? (
        <div className="modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <section className={`old-modal ${modal === "create" ? "create-modal" : ""}`} role="dialog" aria-modal="true">
            {modal === "play" ? (
              <>
                <h2>Spela</h2>
                <button className="modal-choice" type="button" onClick={() => setModal("create")}>Skapa spel</button>
                <button className="modal-choice" type="button" onClick={() => setModal("join")}>Gå med i spel</button>
              </>
            ) : null}

            {modal === "join" ? (
              <>
                <button className="modal-back" type="button" onClick={() => setModal("play")}>←</button>
                <h2>Gå med i spel</h2>
                <form action={joinGame} className="join-form">
                  <input name="code" placeholder="Spelkod" maxLength={6} autoCapitalize="characters" required />
                  <button className="old-button" type="submit">Gå med</button>
                </form>
              </>
            ) : null}

            {modal === "create" ? (
              <>
                <button className="modal-back" type="button" onClick={() => setModal("play")}>←</button>
                <h2>Skapa nytt spel</h2>
                <form action={createGame} className="create-form">
                  <label className="picker-row">
                    <span>Stad</span>
                    <select name="city" value={city} onChange={(e) => setCity(e.target.value)} required>
                      {cities.map((item) => <option value={item} key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="picker-row">
                    <span>Antal hål</span>
                    <select name="holes" value={holes} onChange={(e) => setHoles(Number(e.target.value))} required>
                      {holeOptions.map((n) => <option value={n} key={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="picker-row">
                    <span>Start pub</span>
                    <select name="startPub" key={city} defaultValue={cityBars[0]?.id} required>
                      {cityBars.map((bar) => <option value={bar.id} key={bar.id}>{bar.name}</option>)}
                    </select>
                  </label>
                  <label className="picker-row">
                    <span>Wheel of Doom</span>
                    <select name="wheelCount" defaultValue={Math.min(2, holes)} key={holes} required>
                      {Array.from({ length: holes + 1 }, (_, i) => <option value={i} key={i}>{i}</option>)}
                    </select>
                  </label>
                  <label className="picker-row">
                    <span>Wheel-läge</span>
                    <select name="wheelMode" defaultValue="random" required>
                      <option value="classic">Classic</option>
                      <option value="everyone">Everyone</option>
                      <option value="random">Random</option>
                    </select>
                  </label>
                  <button className="old-button create-submit" type="submit">Skapa spel</button>
                </form>
              </>
            ) : null}

            <button className="modal-close" type="button" onClick={() => setModal(null)} aria-label="Stäng">×</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

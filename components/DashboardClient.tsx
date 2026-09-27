"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createGame, joinGame } from "@/app/dashboard/actions";
import MobileTopBar from "@/components/MobileTopBar";
import QrCodeScanner from "@/components/QrCodeScanner";

type Bar = { id: number; name: string; city: string };
type Modal = null | "play" | "create" | "join";
type RouteMode = "smart-random" | "planned" | "custom";
type CustomStation = { id: number; name: string; address: string };

export default function DashboardClient({ bars, activeCode, error }: { bars: Bar[]; activeCode?: string | null; error?: string }) {
  const [modal, setModal] = useState<Modal>(null);
  const cities = useMemo(() => Array.from(new Set(bars.map((bar) => bar.city))).sort(), [bars]);
  const [city, setCity] = useState(cities[0] ?? "");
  const cityBars = bars.filter((bar) => bar.city === city);
  const maxHoles = Math.max(cityBars.length, 1);
  const holeOptions = [3, 5, 9, 18].filter((n) => n <= maxHoles);
  if (holeOptions.length === 0) holeOptions.push(maxHoles);
  const [holes, setHoles] = useState(holeOptions[0] ?? 1);
  const [wheelEnabled, setWheelEnabled] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>("smart-random");
  const [startPub, setStartPub] = useState(cityBars[0]?.id ?? 0);
  const [selectedBars, setSelectedBars] = useState<number[]>(() => cityBars.slice(0, holeOptions[0] ?? 1).map((bar) => bar.id));
  const [customStations, setCustomStations] = useState<CustomStation[]>([
    { id: 1, name: "", address: "" },
    { id: 2, name: "", address: "" },
  ]);
  const [customCity, setCustomCity] = useState("Umeå");

  useEffect(() => {
    const available = [3, 5, 9, 18].filter((n) => n <= Math.max(cityBars.length, 1));
    const next = available[0] ?? Math.max(cityBars.length, 1);
    if (holes > Math.max(cityBars.length, 1) || !available.includes(holes)) setHoles(next);
  }, [city, cityBars.length, holes]);

  useEffect(() => {
    const nextBars = bars.filter((bar) => bar.city === city);
    const nextHoles = [3, 5, 9, 18].find((count) => count <= nextBars.length) ?? nextBars.length;
    setStartPub(nextBars[0]?.id ?? 0);
    setSelectedBars(nextBars.slice(0, nextHoles).map((bar) => bar.id));
  }, [bars, city]);

  useEffect(() => {
    if (routeMode === "planned" && !selectedBars.includes(startPub)) {
      setStartPub(selectedBars[0] ?? 0);
    }
  }, [routeMode, selectedBars, startPub]);

  const routeHoles = routeMode === "planned" ? selectedBars.length : routeMode === "custom" ? customStations.length : holes;
  const customIsValid = customCity.trim().length >= 2 && customStations.length >= 2 && customStations.every((station) => station.name.trim() && station.address.trim().length >= 3);

  function toggleSelectedBar(barId: number) {
    setSelectedBars((current) => current.includes(barId) ? current.filter((id) => id !== barId) : [...current, barId]);
  }

  function updateCustomStation(id: number, field: "name" | "address", value: string) {
    setCustomStations((current) => current.map((station) => station.id === id ? { ...station, [field]: value } : station));
  }

  function moveCustomStation(index: number, direction: -1 | 1) {
    setCustomStations((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

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
                <QrCodeScanner />
              </>
            ) : null}

            {modal === "create" ? (
              <>
                <button className="modal-back" type="button" onClick={() => setModal("play")}>←</button>
                <h2>Skapa nytt spel</h2>
                <form action={createGame} className="create-form">
                  <label className="picker-row">
                    <span>Ruttläge</span>
                    <select name="routeMode" value={routeMode} onChange={(event) => setRouteMode(event.target.value as RouteMode)} required>
                      <option value="smart-random">Smart slump</option>
                      <option value="planned">Närmaste rutt</option>
                      <option value="custom">Custom game</option>
                    </select>
                  </label>
                  {routeMode !== "custom" ? (
                    <label className="picker-row">
                      <span>Stad</span>
                      <select name="city" value={city} onChange={(e) => setCity(e.target.value)} required>
                        {cities.map((item) => <option value={item} key={item}>{item}</option>)}
                      </select>
                    </label>
                  ) : null}
                  {routeMode === "smart-random" ? (
                    <label className="picker-row">
                      <span>Antal hål</span>
                      <select name="holes" value={holes} onChange={(e) => setHoles(Number(e.target.value))} required>
                        {holeOptions.map((n) => <option value={n} key={n}>{n}</option>)}
                      </select>
                    </label>
                  ) : routeMode === "planned" ? (
                    <div className="pub-picker">
                      <span>Välj pubar <small>({selectedBars.length} valda)</small></span>
                      <div className="pub-picker-list">
                        {cityBars.map((bar) => (
                          <label key={bar.id}>
                            <input
                              type="checkbox"
                              name="selectedBars"
                              value={bar.id}
                              checked={selectedBars.includes(bar.id)}
                              disabled={!selectedBars.includes(bar.id) && selectedBars.length >= 18}
                              onChange={() => toggleSelectedBar(bar.id)}
                            />
                            <span>{bar.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="custom-stations">
                      <input type="hidden" name="customStations" value={JSON.stringify(customStations.map(({ name, address }) => ({ name, address })))} />
                      <label className="custom-city-field">
                        <span>Ort för alla stationer</span>
                        <input name="customCity" value={customCity} maxLength={80} onChange={(event) => setCustomCity(event.target.value)} placeholder="Exempelvis Umeå" required />
                      </label>
                      <p>Första stationen är start. Appen hittar sedan automatiskt närmaste återstående adress.</p>
                      {customStations.map((station, index) => (
                        <fieldset className="custom-station" key={station.id}>
                          <legend>Station {index + 1}</legend>
                          <input value={station.name} maxLength={80} onChange={(event) => updateCustomStation(station.id, "name", event.target.value)} placeholder="Namn, t.ex. Alex" aria-label={`Namn på station ${index + 1}`} required />
                          <input value={station.address} maxLength={200} onChange={(event) => updateCustomStation(station.id, "address", event.target.value)} placeholder="Adress" aria-label={`Adress till station ${index + 1}`} required />
                          <div className="station-actions">
                            <button type="button" onClick={() => moveCustomStation(index, -1)} disabled={index === 0} aria-label="Flytta station upp">↑</button>
                            <button type="button" onClick={() => moveCustomStation(index, 1)} disabled={index === customStations.length - 1} aria-label="Flytta station ned">↓</button>
                            <button type="button" className="remove-station" onClick={() => setCustomStations((current) => current.filter((item) => item.id !== station.id))} disabled={customStations.length <= 2}>Ta bort</button>
                          </div>
                        </fieldset>
                      ))}
                      <button className="add-station" type="button" disabled={customStations.length >= 18} onClick={() => setCustomStations((current) => [...current, { id: Date.now(), name: "", address: "" }])}>+ Lägg till station</button>
                      <small className="map-attribution">Adresserna skickas till OpenStreetMap för geokodning. © OpenStreetMap-bidragsgivare</small>
                    </div>
                  )}
                  {routeMode !== "custom" ? <label className="picker-row">
                    <span>Start pub</span>
                    <select name="startPub" value={startPub} onChange={(event) => setStartPub(Number(event.target.value))} required>
                      {cityBars.filter((bar) => routeMode !== "planned" || selectedBars.includes(bar.id)).map((bar) => <option value={bar.id} key={bar.id}>{bar.name}</option>)}
                    </select>
                  </label> : null}
                  <label className="wheel-toggle-row">
                    <span>Wheel of Doom</span>
                    <input
                      type="checkbox"
                      name="wheelEnabled"
                      checked={wheelEnabled}
                      onChange={(event) => setWheelEnabled(event.target.checked)}
                    />
                  </label>
                  {wheelEnabled ? (
                    <div className="wheel-options">
                      <label className="picker-row">
                        <span>Antal pubar</span>
                        <select name="wheelCount" defaultValue={Math.min(2, routeHoles)} key={routeHoles} required>
                          {Array.from({ length: routeHoles }, (_, i) => <option value={i + 1} key={i + 1}>{i + 1}</option>)}
                        </select>
                      </label>
                      <label className="picker-row">
                        <span>Wheel-läge</span>
                        <select name="wheelMode" defaultValue="classic" required>
                          <option value="classic">Classic</option>
                          <option value="everyone">Everyone</option>
                          <option value="random">Random</option>
                        </select>
                      </label>
                    </div>
                  ) : (
                    <input type="hidden" name="wheelCount" value="0" />
                  )}
                  <button className="old-button create-submit" type="submit" disabled={(routeMode === "planned" && selectedBars.length < 2) || (routeMode === "custom" && !customIsValid)}>Skapa spel</button>
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

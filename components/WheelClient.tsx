"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { revealWheel, resolveWheel } from "@/app/game/[code]/wheel/actions";

type Challenge = {
  id: number;
  emoji: string;
  title: string;
  description: string;
  success_delta: number;
  fail_delta: number;
};

type Reveal = Challenge & { assignment_id: number };

export default function WheelClient({ gameId, code, hole, challenges }: { gameId: number; code: string; hole: number; challenges: Challenge[] }) {
  const router = useRouter();
  const started = useRef(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reveal | null>(null);
  const [notSelected, setNotSelected] = useState(false);
  const [resolved, setResolved] = useState<"completed" | "failed" | null>(null);

  const step = 360 / Math.max(challenges.length, 1);
  const gradient = useMemo(() => {
    const palette = ["#993D02", "#D55108", "#562200", "#E8741E", "#A33F02", "#7b3102", "#c85008", "#f08a35"];
    return `conic-gradient(${challenges.map((_, index) => `${palette[index % palette.length]} ${index * step}deg ${(index + 1) * step}deg`).join(",")})`;
  }, [challenges, step]);

  const spin = useCallback(async () => {
    if (spinning || result || notSelected) return;
    setSpinning(true);
    try {
      const reveal = (await revealWheel(gameId, hole)) as Reveal | null;
      if (!reveal) {
        setNotSelected(true);
        setSpinning(false);
        return;
      }
      const selectedIndex = Math.max(0, challenges.findIndex((item) => item.id === reveal.id));
      const centerAngle = selectedIndex * step + step / 2;
      const extraTurns = 5 + Math.floor(Math.random() * 3);
      setRotation(extraTurns * 360 - centerAngle);
      window.setTimeout(() => {
        setResult(reveal);
        setSpinning(false);
      }, 4200);
    } catch (error) {
      setSpinning(false);
      alert(error instanceof Error ? error.message : "Kunde inte snurra hjulet");
    }
  }, [challenges, gameId, hole, notSelected, result, spinning, step]);

  useEffect(() => {
    if (started.current || challenges.length === 0) return;
    started.current = true;
    void spin();
  }, [challenges.length, spin]);

  async function resolve(completed: boolean) {
    await resolveWheel(gameId, hole, completed);
    setResolved(completed ? "completed" : "failed");
    window.setTimeout(() => router.push(`/game/${code}`), 900);
  }

  return (
    <section className="wheel-modal-card">
      <h1>Wheel of Doom 💀</h1>
      <p className="wheel-hole">Hål {hole}</p>

      <div className="wheel-wrap">
        <div className="pointer" />
        <div className="wheel" style={{ background: gradient, transform: `rotate(${rotation}deg)` }}>
          {challenges.map((challenge, index) => {
            const angle = index * step + step / 2;
            return (
              <span
                key={challenge.id}
                className="wheel-emoji"
                style={{ transform: `rotate(${angle}deg) translateY(calc(var(--wheel-radius) * -1)) rotate(${-angle}deg)` }}
              >
                {challenge.emoji}
              </span>
            );
          })}
        </div>
      </div>

      {!result && !notSelected ? <p className="wheel-spinning-label">Hjulet snurrar…</p> : null}

      {notSelected ? (
        <div className="wheel-result">
          <span className="result-emoji">😌</span>
          <h2>Du klarade dig</h2>
          <p>Du blev inte vald på den här puben.</p>
        </div>
      ) : null}

      {result ? (
        <div className="wheel-result">
          <span className="result-emoji">{result.emoji}</span>
          <h2>{result.title}</h2>
          <p>{result.description}</p>
          <p className="score-delta">Klar: {result.success_delta > 0 ? "+" : ""}{result.success_delta} · Misslyckad: {result.fail_delta > 0 ? "+" : ""}{result.fail_delta}</p>
          {!resolved ? (
            <div className="wheel-resolution-buttons">
              <button className="resolution-button success" onClick={() => resolve(true)}>Klar ✓</button>
              <button className="resolution-button fail" onClick={() => resolve(false)}>Misslyckades</button>
            </div>
          ) : (
            <p className={resolved === "completed" ? "resolved-success" : "resolved-fail"}>{resolved === "completed" ? "Utmaningen är klar!" : "Utmaningen misslyckades."}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

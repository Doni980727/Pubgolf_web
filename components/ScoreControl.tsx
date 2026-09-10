"use client";

import { useState } from "react";
import { saveScore } from "@/app/game/[code]/actions";

export default function ScoreControl({ code, hole, initialScore = 1, confirmed = false }: { code: string; hole: number; initialScore?: number; confirmed?: boolean }) {
  const [score, setScore] = useState(initialScore || 1);

  if (confirmed) {
    return <div className="score-confirmed"><span>{initialScore}</span><small>Bekräftad</small></div>;
  }

  return (
    <div className="my-score-controls">
      <div className="score-stepper">
        <button type="button" onClick={() => setScore((s) => Math.max(1, s - 1))}>−</button>
        <span>{score}</span>
        <button type="button" onClick={() => setScore((s) => Math.min(30, s + 1))}>+</button>
      </div>
      <form action={saveScore}>
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="hole" value={hole} />
        <input type="hidden" name="score" value={score} />
        <button className="confirm-score-button" type="submit">Bekräfta poäng</button>
      </form>
    </div>
  );
}

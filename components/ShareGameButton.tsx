"use client";

import { useState } from "react";

export default function ShareGameButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "PubGolf", text: `Gå med i mitt PubGolf-spel. Kod: ${code}`, url });
        return;
      } catch {
        // User cancelled: fall through to copy.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <button className="old-button share-button" type="button" onClick={share}>{copied ? "Länk kopierad ✓" : "Dela spellänk"}</button>;
}

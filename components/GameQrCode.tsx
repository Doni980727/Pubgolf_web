"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function GameQrCode({ code }: { code: string }) {
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${code}`);
  }, [code]);

  if (!joinUrl) return <div className="game-qr-placeholder" aria-hidden="true" />;

  return (
    <div className="game-qr-code" aria-label={`QR-kod för att gå med i spel ${code}`}>
      <QRCodeSVG value={joinUrl} size={180} level="M" marginSize={2} />
    </div>
  );
}

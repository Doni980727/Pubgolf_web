"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

function getGameCode(value: string) {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/^\/join\/([a-f\d]{6})\/?$/i);
    return match?.[1]?.toUpperCase() ?? null;
  } catch {
    return /^[a-f\d]{6}$/i.test(trimmed) ? trimmed.toUpperCase() : null;
  }
}

export default function QrCodeScanner() {
  const router = useRouter();
  const reactId = useId();
  const scannerId = `qr-reader-${reactId.replace(/:/g, "")}`;
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let disposed = false;
    let scanner: import("html5-qrcode").Html5QrcodeScanner | undefined;

    void import("html5-qrcode").then(({ Html5QrcodeScanner, Html5QrcodeSupportedFormats }) => {
      if (disposed) return;

      scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          rememberLastUsedCamera: true,
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          const code = getGameCode(decodedText);
          if (!code) {
            setError("QR-koden innehåller ingen giltig PubGolf-länk.");
            return;
          }

          setError("");
          void scanner?.clear().finally(() => router.push(`/join/${code}`));
        },
        () => undefined,
      );
    }).catch(() => setError("Kameran kunde inte startas. Kontrollera webbläsarens kamerabehörighet."));

    return () => {
      disposed = true;
      void scanner?.clear().catch(() => undefined);
    };
  }, [isOpen, router, scannerId]);

  return (
    <div className="qr-scanner">
      <div className="join-divider"><span>eller</span></div>
      <button className="qr-scan-button" type="button" onClick={() => { setError(""); setIsOpen((open) => !open); }}>
        {isOpen ? "Stäng kameran" : "Skanna QR-kod"}
      </button>
      {isOpen ? <div id={scannerId} className="qr-reader" /> : null}
      {error ? <p className="qr-error" role="alert">{error}</p> : null}
    </div>
  );
}

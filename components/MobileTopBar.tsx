import Link from "next/link";
import AppLogo from "@/components/AppLogo";

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.8 9a2.35 2.35 0 1 1 3.75 1.9c-1 .74-1.55 1.18-1.55 2.35" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.8 18.2c.9-2.55 2.65-3.8 5.2-3.8s4.3 1.25 5.2 3.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function MobileTopBar({ showBack = false, backHref = "/dashboard" }: { showBack?: boolean; backHref?: string }) {
  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar-left">
        {showBack ? (
          <Link href={backHref} className="icon-button back-icon" aria-label="Tillbaka">←</Link>
        ) : (
          <Link href="/dashboard" aria-label="PubGolf startsida"><AppLogo size={44} /></Link>
        )}
      </div>
      <nav className="mobile-topbar-actions" aria-label="Navigation">
        <Link href="/rules" className="icon-button" aria-label="Regler"><HelpIcon /></Link>
        <Link href="/profile" className="icon-button" aria-label="Profil"><ProfileIcon /></Link>
      </nav>
    </header>
  );
}

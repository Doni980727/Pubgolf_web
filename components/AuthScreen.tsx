"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import AppLogo from "@/components/AppLogo";

type Mode = "login" | "signup";

export default function AuthScreen({ error, message, next }: { error?: string; message?: string; next?: string }) {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <main className="auth-screen animated-bg">
      <section className="auth-content">
        <AppLogo size={120} />

        {mode === "login" ? (
          <>
            <form action={signIn} className="auth-form">
              <input type="hidden" name="next" value={next ?? "/dashboard"} />
              <input name="email" type="email" autoComplete="email" placeholder="Mejladress" required />
              <input name="password" type="password" autoComplete="current-password" placeholder="Lösenord" minLength={6} required />
              {error ? <p className="form-error">{error}</p> : null}
              {message ? <p className="form-message">{message}</p> : null}
              <button className="old-button auth-button" type="submit">Logga in</button>
            </form>
            <button className="text-link" type="button" onClick={() => setMode("signup")}>Har du inget konto? Skapa konto</button>
            <span className="subtle-link">Glömt lösenord?</span>
          </>
        ) : (
          <>
            <form action={signUp} className="auth-form">
              <input type="hidden" name="next" value={next ?? "/dashboard"} />
              <input name="username" placeholder="Användarnamn" minLength={2} maxLength={30} required />
              <input name="email" type="email" autoComplete="email" placeholder="Mejladress" required />
              <input name="password" type="password" autoComplete="new-password" placeholder="Lösenord" minLength={6} required />
              {error ? <p className="form-error">{error}</p> : null}
              <button className="old-button auth-button" type="submit">Skapa konto</button>
            </form>
            <button className="text-link" type="button" onClick={() => setMode("login")}>Har du redan konto? Logga in</button>
          </>
        )}
      </section>
    </main>
  );
}

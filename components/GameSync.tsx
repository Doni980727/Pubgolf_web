"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GameSync({ gameId, fallbackInterval = 30000 }: { gameId: number; fallbackInterval?: number }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const refreshQueued = useRef(false);
  const refreshInProgress = useRef(false);
  const refreshTimer = useRef<number | undefined>(undefined);

  const refresh = useCallback((immediate = false) => {
    window.clearTimeout(refreshTimer.current);

    const run = () => {
      if (refreshInProgress.current) {
        refreshQueued.current = true;
        return;
      }

      refreshInProgress.current = true;
      startRefresh(() => router.refresh());
    };

    if (immediate) run();
    else refreshTimer.current = window.setTimeout(run, 150);
  }, [router]);

  useEffect(() => {
    if (isRefreshing) return;
    refreshInProgress.current = false;

    if (refreshQueued.current) {
      refreshQueued.current = false;
      refresh(true);
    }
  }, [isRefreshing, refresh]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "results", filter: `game_id=eq.${gameId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "wheel_assignments", filter: `game_id=eq.${gameId}` }, () => refresh())
      .subscribe((status) => {
        // Close the gap between the initial server render and the live subscription.
        // A player joining during that gap would otherwise be invisible until polling.
        if (status === "SUBSCRIBED") refresh(true);
      });

    const fallback = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, fallbackInterval);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(refreshTimer.current);
      window.clearInterval(fallback);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [fallbackInterval, gameId, refresh]);

  return null;
}

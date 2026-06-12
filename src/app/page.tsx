import { AddSessionTrigger } from "@/components/add-session-trigger";
import { RecentSessions } from "@/components/recent-sessions";
import { LapChart } from "@/components/lap-chart";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/types/session";

/* ---------------- HELPERS ---------------- */

function parseLap(lap: string): number | null {
  if (!lap) return null;

  if (lap.includes(":")) {
    const [m, s] = lap.split(":").map(Number);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
    return m * 60 + s;
  }

  const v = Number(lap);
  return Number.isFinite(v) ? v : null;
}

function format(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------------- PAGE ---------------- */

export default async function DashboardPage() {
  // ✅ SAFE USER FETCH (NO DUPLICATES)
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data?.user;

  if (userError) {
    console.error("Auth error:", userError);
  }

  // 🚨 HARD GUARD (prevents UUID crash)
  if (!user?.id) {
    redirect("/login");
  }

  // SESSION QUERY (SAFE NOW)
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
  }

  const safeSessions: Session[] = sessions ?? [];

  /* ---------------- LAPS ---------------- */

  const allLaps = safeSessions.flatMap((s) =>
    (s.lap_times ?? [])
      .map(parseLap)
      .filter((v): v is number => v !== null)
  );

  const bestLap = allLaps.length ? Math.min(...allLaps) : null;

  const avgLap = allLaps.length
    ? allLaps.reduce((a, b) => a + b, 0) / allLaps.length
    : null;

  /* ---------------- TRACK RECORDS ---------------- */

  const trackRecords = safeSessions.reduce<Record<string, any>>(
    (acc, session) => {
      const laps = (session.lap_times ?? [])
        .map(parseLap)
        .filter((v): v is number => v !== null);

      if (!laps.length) return acc;

      const best = Math.min(...laps);
      const trackKey = session.track_name ?? "Unknown Track";

      const existing = acc[trackKey];

      if (!existing || best < existing.bestLap) {
        acc[trackKey] = {
          bestLap: best, // ✅ FIXED (was bugged)
          vehicle: session.vehicle,
          sessionId: session.id,
        };
      }

      return acc;
    },
    {}
  );

  /* ---------------- DRIVERS ---------------- */

  const drivers = [
    ...new Set(
      safeSessions
        .map((s) => s.driver_name)
        .filter(Boolean)
    ),
  ];

  /* ---------------- DRIVER RECORDS ---------------- */

  const driverRecords = safeSessions.reduce<Record<string, number>>(
    (acc, session) => {
      const laps = (session.lap_times ?? [])
        .map(parseLap)
        .filter((v): v is number => v !== null);

      if (!laps.length) return acc;

      const best = Math.min(...laps);
      const driver = session.driver_name || "Unknown";

      if (!acc[driver] || best < acc[driver]) {
        acc[driver] = best;
      }

      return acc;
    },
    {}
  );

  /* ---------------- CHART ---------------- */

  const chartData = allLaps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-white relative">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">
          Stage / Line
        </h1>

        <div className="flex items-center gap-4">
          <AddSessionTrigger />

          <Link
            href="/login"
            className="text-xs text-zinc-500 hover:text-red-400"
          >
            Sign out
          </Link>
        </div>
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500 uppercase">Best

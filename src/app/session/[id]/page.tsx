import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

import type { Session } from "@/types/session";

/* ---------------- HELPERS ---------------- */

function parseLap(lap: unknown): number | null {
  if (lap === null || lap === undefined) return null;

  const n = Number(lap);
  return Number.isFinite(n) ? n : null;
}

function formatLap(sec: number | null) {
  if (sec === null || sec === undefined) return "—";

  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------------- PAGE ---------------- */

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* ---------------- SESSION ---------------- */

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    redirect("/");
  }

  const session = data as Session;

  /* ---------------- NORMALIZED LAPS ---------------- */

  const laps: number[] = Array.isArray(session.lap_times)
    ? session.lap_times
        .map(parseLap)
        .filter((v): v is number => v !== null)
    : [];

  const bestLap = laps.length ? Math.min(...laps) : null;

  const avgLap =
    laps.length > 0
      ? laps.reduce((a, b) => a + b, 0) / laps.length
      : null;

  const chartData = laps.map((lap, index) => ({
    lap: index + 1,
    time: lap,
  }));

  /* ---------------- ENGINEERING LOGIC ---------------- */

  const slowestLap = laps.length ? Math.max(...laps) : null;

  const spread =
    bestLap !== null && slowestLap !== null
      ? slowestLap - bestLap
      : 0;

  let consistency = "Needs Work";

  if (spread < 0.3) consistency = "Elite";
  else if (spread < 0.6) consistency = "Excellent";
  else if (spread < 1) consistency = "Good";
  else if (spread < 2) consistency = "Fair";

  const recommendation =
    consistency === "Elite"
      ? "Excellent consistency. Keep this setup."
      : consistency === "Excellent"
      ? "Very consistent session. Minor tuning only."
      : consistency === "Good"
      ? "Car looks good. Focus on repeatability."
      : "Large lap spread detected. Work on consistency before changing setup.";

  /* ---------------- PREVIOUS SESSION ---------------- */

  const { data: previousSessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const previousSession = previousSessions?.[0];

  /* ---------------- INTELLIGENCE ---------------- */

  let intelligenceMessage = "Not enough session data yet.";

  if (previousSession) {
    const previousLaps: number[] = Array.isArray(previousSession.lap_times)
      ? previousSession.lap_times
          .map(parseLap)
          .filter((v): v is number => v !== null)
      : [];

    const previousBest =
      previousLaps.length > 0 ? Math.min(...previousLaps) : null;

    if (previousBest !== null && bestLap !== null) {
      const delta = previousBest - bestLap;

      if (delta > 0) {
        intelligenceMessage = `You went ${delta.toFixed(
          2
        )} seconds faster than your previous session.`;
      } else if (delta < 0) {
        intelligenceMessage = `You were ${Math.abs(delta).toFixed(
          2
        )} seconds slower than your previous session.`;
      } else {
        intelligenceMessage =
          "You matched your previous best lap exactly.";
      }
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-red-400">
          ← Back
        </Link>

        <AddSessionTrigger session={session} />
      </div>

      {/* MAIN */}
      <div className="mx-auto max-w-6xl p-6 space-y-8">

        {/* TITLE */}
        <div>
          <h1 className="text-4xl font-black tracking-[0.2em] text-red-500">
            SESSION
          </h1>

          <p className="mt-2 text-zinc-500">{session.track_name}</p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 border border-red-500/10">
            <p className="text-zinc-500 text-sm">Best Lap</p>
            <p className="text-3xl font-mono text-red-400 mt-2">
              {formatLap(bestLap)}
            </p>
          </div>

          <div className="p-6 border border-white/5">
            <p className="text-zinc-500 text-sm">Average Lap</p>
            <p className="text-3xl font-mono mt-2">
              {formatLap(avgLap)}
            </p>
          </div>

          <div className="p-6 border border-white/5">
            <p className="text-zinc-500 text-sm">Total Laps</p>
            <p className="text-3xl font-mono mt-2">{laps.length}</p>
          </div>
        </div>

        {/* RACE ENGINEER */}
        <div className="p-6 border border-red-500/20">
          <h2 className="text-xs uppercase text-red-400">
            Race Engineer
          </h2>

          <p className="mt-4 text-lg">{recommendation}</p>

          <p className="mt-4 text-red-300">
            {intelligenceMessage}
          </p>
        </div>

        {/* CHART */}
        <div className="p-6 border border-white/5">
          <h2 className="text-xs uppercase text-zinc-500">
            Lap Progression
          </h2>

          <LapChart data={chartData} />
        </div>

        {/* DRIVER NOTES */}
        <div className="p-6 border border-white/5">
          <h2 className="text-xs uppercase text-zinc-500">
            Driver Notes
          </h2>

          <p className="mt-4 text-zinc-300">
            {session.driver_notes || "No notes recorded."}
          </p>
        </div>
      </div>
    </div>
  );
}

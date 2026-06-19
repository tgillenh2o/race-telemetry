import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import type { Session } from "@/types/session";
import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

/* ---------------- HELPERS ---------------- */

function formatLap(sec: number | null) {
  if (!sec && sec !== 0) return "—";

  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------------- PAGE ---------------- */

export default async function SessionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !session) redirect("/");

  const typed = session as Session;

  /* ---------------- NORMALIZE LAPS (NO PARSE LAP) ---------------- */

  const laps: number[] = Array.isArray(typed.lap_times)
    ? typed.lap_times
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n))
    : [];

  /* ---------------- CORE STATS ---------------- */

  const bestLap = laps.length ? Math.min(...laps) : null;

  const avgLap = laps.length
    ? laps.reduce((a, b) => a + b, 0) / laps.length
    : null;

  const spread =
    laps.length > 1 ? Math.max(...laps) - Math.min(...laps) : 0;

  const chartData = laps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  /* ---------------- CONSISTENCY ---------------- */

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
      : "Large lap spread detected. Work on consistency before setup changes.";

  /* ---------------- PREVIOUS SESSION ---------------- */

  const { data: previousSessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .neq("id", params.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const prev = previousSessions?.[0];

  const prevLaps: number[] = Array.isArray(prev?.lap_times)
    ? prev.lap_times.map((n) => Number(n)).filter(Number.isFinite)
    : [];

  const prevBest = prevLaps.length ? Math.min(...prevLaps) : null;

  const delta =
    prevBest !== null && bestLap !== null
      ? prevBest - bestLap
      : null;

  let insight = "Not enough session data yet.";

  if (delta !== null) {
    if (delta > 0) insight = `You improved by ${delta.toFixed(2)}s vs last session.`;
    else if (delta < 0)
      insight = `You were ${Math.abs(delta).toFixed(2)}s slower than last session.`;
    else insight = "You matched your previous best.";
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-red-400">
          ← Back
        </Link>

        <AddSessionTrigger session={typed} />
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl p-6 space-y-8">

        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-black text-red-500">SESSION</h1>
          <p className="text-zinc-500">{typed.track_name}</p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-4">

          <div className="p-5 border border-red-500/10 rounded-xl">
            <p className="text-zinc-500 text-sm">Best Lap</p>
            <p className="text-3xl font-mono text-red-400">
              {formatLap(bestLap)}
            </p>
          </div>

          <div className="p-5 border border-white/10 rounded-xl">
            <p className="text-zinc-500 text-sm">Average</p>
            <p className="text-3xl font-mono">{formatLap(avgLap)}</p>
          </div>

          <div className="p-5 border border-white/10 rounded-xl">
            <p className="text-zinc-500 text-sm">Total Laps</p>
            <p className="text-3xl font-mono">{laps.length}</p>
          </div>

        </div>

        {/* INSIGHT */}
        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-sm text-zinc-500">Insight</p>
          <p className="mt-2">{insight}</p>
        </div>

        {/* LAP ANALYSIS */}
        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-sm text-zinc-500 mb-4">Lap Breakdown</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 text-sm">Fastest</p>
              <p className="text-xl text-green-400 font-mono">
                {formatLap(bestLap)}
              </p>
            </div>

            <div>
              <p className="text-zinc-500 text-sm">Spread</p>
              <p className="text-xl font-mono">{spread.toFixed(2)}s</p>
            </div>
          </div>
        </div>

        {/* DRIVER NOTES */}
        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-sm text-zinc-500">Notes</p>
          <p className="mt-2 text-zinc-300">
            {typed.driver_notes || "No notes"}
          </p>
        </div>

        {/* CHART (BOTTOM OF PAGE AS REQUESTED) */}
        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-sm text-zinc-500 mb-4">Lap Chart</p>
          <LapChart data={chartData} />
        </div>

      </div>
    </div>
  );
}

import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

import type { Session } from "@/types/session";

/* ---------------- SAFE LAP PARSER ---------------- */

function parseLap(lap: string | number | null | undefined): number | null {
  if (lap === null || lap === undefined) return null;

  if (typeof lap === "number") {
    return Number.isFinite(lap) ? lap : null;
  }

  if (typeof lap !== "string") return null;

  if (lap.includes(":")) {
    const [m, s] = lap.split(":").map(Number);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
    return m * 60 + s;
  }

  const v = Number(lap);
  return Number.isFinite(v) ? v : null;
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
  params: { id: string };
}) {
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) redirect("/");

  const session = data as Session;

  /* ---------------- NORMALIZED LAPS ---------------- */

  const laps = (session.lap_times ?? [])
    .map(parseLap)
    .filter((v): v is number => v !== null);

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

  let consistency = "Needs Work";
  if (spread < 0.3) consistency = "Elite";
  else if (spread < 0.6) consistency = "Excellent";
  else if (spread < 1) consistency = "Good";
  else if (spread < 2) consistency = "Fair";

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-red-400">
          ← Back
        </Link>

        <AddSessionTrigger session={session} />
      </div>

      <div className="mx-auto max-w-6xl p-6 space-y-10">

        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-black text-red-500 tracking-widest">
            SESSION
          </h1>
          <p className="text-zinc-500">{session.track_name}</p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-4">

          <div className="p-5 rounded-xl border border-red-500/20">
            <p className="text-zinc-500 text-sm">Best Lap</p>
            <p className="text-3xl font-mono text-red-400">
              {formatLap(bestLap)}
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10">
            <p className="text-zinc-500 text-sm">Average Lap</p>
            <p className="text-3xl font-mono">
              {formatLap(avgLap)}
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10">
            <p className="text-zinc-500 text-sm">Total Laps</p>
            <p className="text-3xl font-mono">{laps.length}</p>
          </div>

        </div>

        {/* LAP TIMES (THIS FIXES YOUR “NOT SHOWING” ISSUE) */}
        <div className="p-5 border border-white/10 rounded-xl">
          <h2 className="text-sm text-zinc-500 mb-3">Lap Times</h2>

          <div className="flex flex-wrap gap-2">
            {laps.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No lap times recorded
              </p>
            ) : (
              laps.map((lap, i) => (
                <div
                  key={i}
                  className="px-3 py-1 rounded bg-zinc-800 font-mono"
                >
                  {formatLap(lap)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ANALYSIS */}
        <div className="p-6 border border-red-500/10 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase tracking-widest">
            Analysis
          </p>

          <p className="text-xl mt-3">
            Consistency:{" "}
            <span className="text-red-400">{consistency}</span>
          </p>

          <p className="text-zinc-400 mt-2">
            Spread: {spread.toFixed(2)} sec
          </p>
        </div>

        {/* NOTES */}
        <div className="p-6 border border-white/10 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase tracking-widest">
            Driver Notes
          </p>

          <p className="mt-3 text-zinc-300">
            {session.driver_notes || "No notes recorded."}
          </p>
        </div>

        {/* GRAPH (BOTTOM AS REQUESTED) */}
        <div className="p-6 border border-white/10 rounded-xl">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">
            Lap Progression
          </h2>

          <div className="mt-6">
            <LapChart data={chartData} />
          </div>
        </div>

      </div>
    </div>
  );
}

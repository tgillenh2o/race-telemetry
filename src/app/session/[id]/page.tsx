import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

import type { Session } from "@/types/session";

/* ---------------- SAFE NORMALIZER ---------------- */

function normalizeLaps(input: unknown): number[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
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

  /* ---------------- LAPS (CLEAN) ---------------- */

  const laps = normalizeLaps(session.lap_times);

  const bestLap = laps.length ? Math.min(...laps) : null;
  const avgLap = laps.length
    ? laps.reduce((a, b) => a + b, 0) / laps.length
    : null;

  const chartData = laps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  const spread =
    laps.length > 1 ? Math.max(...laps) - Math.min(...laps) : 0;

  const consistency =
    spread < 0.3
      ? "Elite"
      : spread < 0.6
      ? "Excellent"
      : spread < 1
      ? "Good"
      : "Needs Work";

  const recommendation =
    consistency === "Elite"
      ? "Perfect consistency. Keep pushing."
      : consistency === "Excellent"
      ? "Very strong session."
      : consistency === "Good"
      ? "Solid pace. Work on repeatability."
      : "Large variation. Focus consistency first.";

  /* ---------------- RENDER ---------------- */

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-zinc-400 hover:text-red-400">
          ← Back
        </Link>

        <AddSessionTrigger session={session} />
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-red-500">
            {session.track_name}
          </h1>
          <p className="text-zinc-500">{session.vehicle}</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-white/10 rounded">
            <p className="text-zinc-500">Best</p>
            <p className="text-xl text-red-400 font-mono">
              {bestLap?.toFixed(2) ?? "—"}
            </p>
          </div>

          <div className="p-4 border border-white/10 rounded">
            <p className="text-zinc-500">Avg</p>
            <p className="text-xl font-mono">
              {avgLap?.toFixed(2) ?? "—"}
            </p>
          </div>

          <div className="p-4 border border-white/10 rounded">
            <p className="text-zinc-500">Laps</p>
            <p className="text-xl font-mono">{laps.length}</p>
          </div>
        </div>

        {/* LAP LIST (EDITABLE DISPLAY STYLE) */}
        <div className="border border-white/10 rounded p-4">
          <p className="text-zinc-500 mb-3">Lap Times</p>

          <div className="flex flex-wrap gap-2">
            {laps.length === 0 && (
              <p className="text-zinc-600 text-sm">
                No lap data
              </p>
            )}

            {laps.map((lap, i) => (
              <div
                key={i}
                className="px-3 py-1 rounded bg-zinc-900 border border-white/10 font-mono"
              >
                {lap.toFixed(2)}
              </div>
            ))}
          </div>
        </div>

        {/* RACE ENGINEER */}
        <div className="p-5 border border-red-500/20 rounded bg-zinc-950">
          <p className="text-red-400 uppercase text-xs tracking-widest">
            Race Engineer
          </p>

          <p className="mt-3 text-lg">{recommendation}</p>

          <p className="mt-2 text-zinc-500 text-sm">
            Spread: {spread.toFixed(2)} sec | Consistency: {consistency}
          </p>
        </div>

        {/* NOTES */}
        <div className="p-5 border border-white/10 rounded">
          <p className="text-zinc-500 text-sm">Driver Notes</p>
          <p className="mt-2">{session.driver_notes || "—"}</p>
        </div>

        {/* CHART (BOTTOM AS REQUESTED) */}
        <div className="p-5 border border-white/10 rounded">
          <p className="text-zinc-500 text-sm mb-4">
            Lap Progression
          </p>

          <LapChart data={chartData} />
        </div>

      </div>
    </div>
  );
}

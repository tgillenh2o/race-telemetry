import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

import type { Session } from "@/types/session";

/* ---------------- HELPERS (MATCH HOME PAGE) ---------------- */

function parseLap(lap: string | number): number | null {
  if (typeof lap === "number") {
    return Number.isFinite(lap) ? lap : null;
  }

  if (!lap) return null;

  if (String(lap).includes(":")) {
    const [m, s] = String(lap).split(":").map(Number);

    if (!Number.isFinite(m) || !Number.isFinite(s)) {
      return null;
    }

    return m * 60 + s;
  }

  const value = Number(lap);

  return Number.isFinite(value) ? value : null;
}

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

  /* ---------------- LAPS (FIXED) ---------------- */

  const laps = (session.lap_times ?? [])
    .map(parseLap)
    .filter((v): v is number => v !== null);

  const bestLap =
    laps.length > 0 ? Math.min(...laps) : null;

  const avgLap =
    laps.length > 0
      ? laps.reduce((a, b) => a + b, 0) / laps.length
      : null;

  const chartData = laps.map((lap, index) => ({
    lap: index + 1,
    time: lap,
  }));

  const spread =
    laps.length > 1
      ? Math.max(...laps) - Math.min(...laps)
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
      : "Large lap spread detected. Work on consistency before setup changes.";

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

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl p-6 space-y-8">
        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-red-500">Session</h1>
          <p className="text-zinc-500 mt-1">{session.track_name}</p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-zinc-900">
            <p className="text-zinc-500 text-sm">Best Lap</p>
            <p className="text-2xl font-mono text-red-400">
              {formatLap(bestLap)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900">
            <p className="text-zinc-500 text-sm">Average</p>
            <p className="text-2xl font-mono">
              {formatLap(avgLap)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900">
            <p className="text-zinc-500 text-sm">Total Laps</p>
            <p className="text-2xl font-mono">{laps.length}</p>
          </div>
        </div>

        {/* LAP CHART */}
        <div className="p-6 rounded-xl bg-zinc-900">
          <h2 className="text-sm text-zinc-500 uppercase tracking-widest">
            Lap Progression
          </h2>

          <div className="mt-4">
            <LapChart data={chartData} />
          </div>
        </div>

        {/* LAP LIST (THIS FIXES YOUR ISSUE) */}
        <div className="p-6 rounded-xl bg-zinc-900">
          <h2 className="text-sm text-zinc-500 uppercase tracking-widest">
            Lap Times
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {laps.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No lap times recorded
              </p>
            ) : (
              laps.map((lap, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-black rounded font-mono text-sm"
                >
                  {lap.toFixed(2)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* NOTES */}
        <div className="p-6 rounded-xl bg-zinc-900">
          <h2 className="text-sm text-zinc-500 uppercase tracking-widest">
            Driver Notes
          </h2>

          <p className="mt-3 text-zinc-300">
            {session.driver_notes || "No notes recorded."}
          </p>
        </div>

        {/* RECOMMENDATION */}
        <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
          <h2 className="text-sm text-red-400 uppercase tracking-widest">
            Race Engineer
          </h2>

          <p className="mt-3 text-lg">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}

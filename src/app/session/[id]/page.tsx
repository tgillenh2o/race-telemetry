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

  /* ---------------- HISTORY (for cross-session comparison) ---------------- */

  const { data: history } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("track_name", session.track_name)
    .neq("id", session.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const pastSessions = (history ?? []) as Session[];

  /* ---------------- LAPS ---------------- */

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

  const spreadPct = avgLap ? (spread / avgLap) * 100 : 0;

  let consistency = "Needs Work";
  if (spreadPct < 1) consistency = "Elite";
  else if (spreadPct < 2) consistency = "Excellent";
  else if (spreadPct < 4) consistency = "Good";
  else if (spreadPct < 7) consistency = "Fair";

  function getTrend(laps: number[]) {
    if (laps.length < 4) return null;

    const half = Math.floor(laps.length / 2);
    const firstHalf = laps.slice(0, half);
    const secondHalf = laps.slice(-half);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const delta = avg(secondHalf) - avg(firstHalf);
    const deltaPct = (delta / avg(firstHalf)) * 100;

    if (deltaPct > 2) return "fading";
    if (deltaPct < -2) return "improving";
    return "stable";
  }

  const trend = getTrend(laps);

  function findOutliers(laps: number[], best: number) {
    return laps
      .map((lap, i) => ({ lap, i }))
      .filter(({ lap }) => lap > best * 1.08);
  }

  const outliers = bestLap ? findOutliers(laps, bestLap) : [];

  function getHistoryStats(pastSessions: Session[]) {
    const allLaps = pastSessions.flatMap((s) =>
      (s.lap_times ?? [])
        .map(parseLap)
        .filter((v): v is number => v !== null)
    );

    if (allLaps.length === 0) return null;

    return {
      historicalBest: Math.min(...allLaps),
      historicalAvg: allLaps.reduce((a, b) => a + b, 0) / allLaps.length,
      sessionCount: pastSessions.length,
    };
  }

  const historyStats = getHistoryStats(pastSessions);

  function getRecommendation({
    consistency,
    trend,
    outliers,
    lapCount,
    weather,
    tirePressure,
    shockSetup,
    bestLap,
    historyStats,
  }: {
    consistency: string;
    trend: string | null;
    outliers: { lap: number; i: number }[];
    lapCount: number;
    weather?: string;
    tirePressure?: string;
    shockSetup?: string;
    bestLap: number | null;
    historyStats: { historicalBest: number; historicalAvg: number; sessionCount: number } | null;
  }) {
    if (lapCount < 3) {
      return "Not enough laps yet for a reliable read. Log a few more.";
    }

    if (outliers.length > 0) {
      return `${outliers.length} lap${outliers.length > 1 ? "s" : ""} significantly off pace (lap ${outliers
        .map((o) => o.i + 1)
        .join(", ")}) — likely traffic or an off-track moment. Excluding ${outliers.length > 1 ? "those" : "that"}, focus on the remaining trend.`;
    }

    // Cross-session comparison
    if (historyStats && bestLap !== null) {
      if (bestLap < historyStats.historicalBest) {
        const improvement = historyStats.historicalBest - bestLap;
        return `New best lap at this track — ${improvement.toFixed(2)}s faster than your previous best across ${historyStats.sessionCount} session${historyStats.sessionCount > 1 ? "s" : ""}. Whatever changed, it's working.`;
      }

      const offPace = bestLap - historyStats.historicalBest;
      if (offPace > historyStats.historicalBest * 0.03) {
        return `Best lap this session is ${offPace.toFixed(2)}s off your historical best at this track. Worth comparing today's setup against past sessions that ran faster.`;
      }
    }

    if (trend === "fading") {
      const hot = weather && /hot|warm|sunny/i.test(weather);
      if (tirePressure) {
        return `Pace dropped off through the session. With tires set at ${tirePressure}${hot ? " in hot conditions" : ""}, this looks like tire heat build-up or wear — consider starting a notch lower on pressure next time out.`;
      }
      return "Pace dropped off through the session — could be tire wear, fuel load, or driver fatigue. Worth checking long-run pace specifically.";
    }

    if (trend === "improving") {
      return "Pace improved as the session went on — track evolution or driver ramp-up. Early laps may not reflect true potential.";
    }

    if (consistency === "Elite") {
      return `Excellent consistency${shockSetup ? ` — current shock setup (${shockSetup}) is working well. Keep it.` : ". Keep this setup."}`;
    }
    if (consistency === "Excellent") return "Very consistent session. Minor tuning only.";
    if (consistency === "Good") return "Car looks good. Focus on repeatability.";

    if (shockSetup) {
      return `Large lap spread detected. With the current shock setup (${shockSetup}), start there — consider adjusting before changing anything else.`;
    }
    return "Large lap spread detected. Work on consistency before setup changes.";
  }

  const recommendation = getRecommendation({
    consistency,
    trend,
    outliers,
    lapCount: laps.length,
    weather: session.weather,
    tirePressure: session.tire_pressure,
    shockSetup: session.shock_setup,
    bestLap,
    historyStats,
  });

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

        {/* RECOMMENDATION */}
        <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
          <h2 className="text-sm text-red-400 uppercase tracking-widest">
            Race Engineer
          </h2>

          <p className="mt-3 text-lg">{recommendation}</p>
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

        {/* LAP LIST */}
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
                  {formatLap(lap)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* SETUP INFO */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 rounded-xl bg-zinc-900">
            <h2 className="text-sm text-zinc-500 uppercase tracking-widest">
              Tire Pressure
            </h2>
            <p className="mt-3 text-zinc-300">
              {session.tire_pressure || "Not recorded"}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900">
            <h2 className="text-sm text-zinc-500 uppercase tracking-widest">
              Shock Setup
            </h2>
            <p className="mt-3 text-zinc-300">
              {session.shock_setup || "Not recorded"}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900">
            <h2 className="text-sm text-zinc-500 uppercase tracking-widest">
              Weather
            </h2>
            <p className="mt-3 text-zinc-300">
              {session.weather || "Not recorded"}
            </p>
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
      </div>
    </div>
  );
}

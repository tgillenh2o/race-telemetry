import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

import type { Session } from "@/types/session";

/* ---------------- HELPERS ---------------- */

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

  if (!user) redirect("/login");

  /* ---------------- SESSION ---------------- */

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) redirect("/");

  const session = data as Session;

  /* ---------------- LAPS (SOURCE OF TRUTH) ---------------- */

  const laps: number[] = session.lap_times ?? [];

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

  const fastestLap = bestLap ?? 0;

  const slowestLap =
    laps.length > 0 ? Math.max(...laps) : 0;

  const fastestLapIndex =
    bestLap !== null ? laps.indexOf(bestLap) + 1 : null;

  const slowestLapIndex =
    laps.length > 0 ? laps.indexOf(slowestLap) + 1 : null;

  const spread =
    laps.length > 0 ? slowestLap - fastestLap : 0;

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
    const previousLaps: number[] =
      previousSession.lap_times ?? [];

    const previousBest =
      previousLaps.length > 0
        ? Math.min(...previousLaps)
        : null;

    if (previousBest !== null && bestLap !== null) {
      const delta = previousBest - bestLap;

      if (delta > 0) {
        intelligenceMessage = `You went ${delta.toFixed(
          2
        )} seconds faster than your previous session.`;
      } else if (delta < 0) {
        intelligenceMessage = `You were ${Math.abs(
          delta
        ).toFixed(2)} seconds slower than your previous session.`;
      } else {
        intelligenceMessage =
          "You matched your previous best lap exactly.";
      }
    }
  }

  /* ---------------- ALL SESSIONS ---------------- */

  const { data: allSessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id);

  const allBestLaps = (allSessions ?? []).flatMap(
    (s) => s.lap_times ?? []
  );

  const overallBest =
    allBestLaps.length > 0
      ? Math.min(...allBestLaps)
      : null;

  const isPersonalRecord =
    bestLap !== null &&
    overallBest !== null &&
    bestLap <= overallBest;

  const isConsistent =
    laps.length > 1 &&
    Math.max(...laps) - Math.min(...laps) < 2;

  const improvedSession =
    intelligenceMessage.includes("faster");

  /* ---------------- SETUP INTELLIGENCE ---------------- */

  const tirePressureValue = parseFloat(
    session.tire_pressure || "0"
  );

  let setupInsight = "Not enough setup data yet.";

  const sessionsWithPressure = (allSessions ?? []).filter(
    (s) =>
      s.tire_pressure &&
      !isNaN(parseFloat(s.tire_pressure))
  );

  if (sessionsWithPressure.length >= 3 && bestLap !== null) {
    const avgPressure =
      sessionsWithPressure.reduce(
        (acc, s) =>
          acc + parseFloat(s.tire_pressure || "0"),
        0
      ) / sessionsWithPressure.length;

    if (tirePressureValue > avgPressure + 1) {
      setupInsight =
        "Your fastest sessions tend to use lower tire pressures.";
    } else if (tirePressureValue < avgPressure - 1) {
      setupInsight =
        "You may benefit from slightly higher tire pressure for stability.";
    } else {
      setupInsight =
        "Your tire pressure is aligned with your fastest sessions.";
    }
  }

  /* ---------------- COMPARISON ---------------- */

  let comparisonData: any = null;

  if (previousSession) {
    const previousLaps: number[] =
      previousSession.lap_times ?? [];

    const previousBest =
      previousLaps.length > 0
        ? Math.min(...previousLaps)
        : null;

    comparisonData = {
      bestLapDelta:
        bestLap !== null && previousBest !== null
          ? previousBest - bestLap
          : null,
      previousVehicle: previousSession.vehicle ?? "—",
      previousPressure: previousSession.tire_pressure ?? "—",
      previousShock: previousSession.shock_setup ?? "—",
      previousBest,
    };
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-400">
          ← Back
        </Link>

        <AddSessionTrigger session={session} />
      </div>

      {/* MAIN */}
      <div className="mx-auto max-w-6xl p-6 space-y-8">
        <h1 className="text-4xl font-black text-red-500">
          SESSION
        </h1>

        <p className="text-zinc-500">{session.track_name}</p>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p>Best Lap</p>
            <p>{formatLap(bestLap)}</p>
          </div>

          <div>
            <p>Average Lap</p>
            <p>{formatLap(avgLap)}</p>
          </div>

          <div>
            <p>Total Laps</p>
            <p>{laps.length}</p>
          </div>
        </div>

        {/* NOTES */}
        <div>
          <h2>Driver Notes</h2>
          <p>{session.driver_notes || "No notes recorded."}</p>
        </div>

        {/* CHART */}
        <LapChart data={chartData} />
      </div>
    </div>
  );
}

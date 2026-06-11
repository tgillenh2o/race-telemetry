
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

import { LapChart } from "@/components/lap-chart";
import { SessionCompare } from "@/components/session-compare";
import { EditSessionTrigger } from "@/components/edit-session-trigger";
import { DeleteSessionButton } from "@/components/delete-session-button";


import { formatLapTime } from "@/lib/sectors";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ---------------- FETCH ----------------

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  const { data: allSessions } = await supabase
    .from("sessions")
    .select("*");

  if (error || !session) {
    return (
      <div className="p-10 text-white">
        <h1 className="text-xl font-bold">
          Session not found
        </h1>

        <p className="mt-2 text-zinc-400">
          {error?.message}
        </p>
      </div>
    );
  }

  // ---------------- HELPERS ----------------

  function parseLap(lap: string) {
    const [m, s] = lap.split(":");

    const minutes = parseInt(m, 10);
    const seconds = parseInt(s, 10);

    if (
      Number.isNaN(minutes) ||
      Number.isNaN(seconds)
    ) {
      return null;
    }

    return minutes * 60 + seconds;
  }

  function format(sec: number | null) {
    if (!sec) return "—";

    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);

    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function average(arr: number[]) {
    if (!arr.length) return null;

    return (
      arr.reduce((a, b) => a + b, 0) /
      arr.length
    );
  }

  // ---------------- LAP DATA ----------------

  const laps =
    (session.lap_times ?? [])
      .map(parseLap)
      .filter(
        (v): v is number => v !== null
      ) ?? [];

  const moto1 = laps.slice(0, 5);
  const moto2 = laps.slice(5, 10);

  const moto1Avg = average(moto1);
  const moto2Avg = average(moto2);

  const idealMoto =
    moto1.length && moto2.length
      ? (
          Math.min(...moto1) +
          Math.min(...moto2)
        ) / 2
      : null;

  // ---------------- METRICS ----------------

  const bestLap = laps.length
    ? Math.min(...laps)
    : null;

  const avgLap = average(laps);

  const consistency =
    laps.length > 1
      ? Math.sqrt(
          laps
            .map((l) =>
              Math.pow(
                l - (avgLap ?? 0),
                2
              )
            )
            .reduce((a, b) => a + b, 0) /
            laps.length
        )
      : null;

  // ---------------- PRS ----------------

  const otherSessions =
    (allSessions ?? []).filter(
      (s: any) => s.id !== session.id
    );

  const parseSessionLaps = (sessions: any[]) =>
    sessions.flatMap((s: any) =>
      (s.lap_times ?? [])
        .map(parseLap)
        .filter(
          (v): v is number => v !== null
        )
    );

  const overallLaps =
    parseSessionLaps(otherSessions);

  const overallPR =
    overallLaps.length
      ? Math.min(...overallLaps)
      : null;

  const isOverallPR =
    bestLap !== null &&
    (
      overallPR === null ||
      bestLap < overallPR
    );

  const trackSessions =
    otherSessions.filter(
      (s: any) =>
        s.track_name ===
        session.track_name
    );

  const trackLaps =
    parseSessionLaps(trackSessions);

  const trackPR =
    trackLaps.length
      ? Math.min(...trackLaps)
      : null;

  const isTrackPR =
    bestLap !== null &&
    (
      trackPR === null ||
      bestLap < trackPR
    );

  const driverSessions =
    otherSessions.filter(
      (s: any) =>
        s.driver_name ===
        session.driver_name
    );

  const driverLaps =
    parseSessionLaps(driverSessions);

  const driverPR =
    driverLaps.length
      ? Math.min(...driverLaps)
      : null;

  const isDriverPR =
    bestLap !== null &&
    (
      driverPR === null ||
      bestLap < driverPR
    );

  // ---------------- CHART DATA ----------------

  const chartData = laps.map(
    (lap, index) => ({
      lap: index + 1,
      time: lap,
    })
  );

  const progressionData =
    trackSessions.map(
      (s: any, index: number) => {
        const parsed =
          (s.lap_times ?? [])
            .map(parseLap)
            .filter(
              (v): v is number =>
                v !== null
            );

        if (!parsed.length) return null;

        return {
          session: `S${index + 1}`,
          lap: Math.min(...parsed),
        };
      }
    ).filter(Boolean) ?? [];

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white md:p-8">

      {/* HERO */}
      <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-8">

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

          <div>

            {session.driver_name && (
              <div className="mb-3 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-300">
                {session.driver_name}
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {session.event_name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">

              <span>
                {session.track_name}
              </span>

              <span>•</span>

              <span>
                {session.session_date}
              </span>

              <span>•</span>

              <span>
                {session.vehicle}
              </span>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            {isOverallPR && (
              <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs uppercase tracking-widest text-yellow-300">
                🏆 Overall PR
              </div>
            )}

            {isTrackPR && (
              <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs uppercase tracking-widest text-green-300">
                🏁 Track PR
              </div>
            )}

            {isDriverPR && (
              <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs uppercase tracking-widest text-blue-300">
                ⚡ Driver PR
              </div>
            )}

          </div>

        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-wrap gap-4">

          <Link
            href="/"
            className="rounded-xl border border-white/5 bg-black/30 px-4 py-2 text-sm text-zinc-300 transition hover:border-red-500/30 hover:text-white"
          >
            ← Dashboard
          </Link>

          <EditSessionTrigger
            session={session}
          />

          <DeleteSessionButton
            sessionId={session.id}
          />

        </div>

      </div>

      {/* KPI ROW */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

        <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Best Lap
          </p>

          <p className="mt-2 font-mono text-3xl text-red-400">
            {format(bestLap)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Avg Lap
          </p>

          <p className="mt-2 font-mono text-3xl">
            {format(avgLap)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Consistency
          </p>

          <p className="mt-2 font-mono text-3xl">
            {consistency
              ? consistency.toFixed(2)
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-green-500/10 bg-green-500/5 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Ideal Moto
          </p>

          <p className="mt-2 font-mono text-3xl text-green-400">
            {idealMoto !== null
              ? formatLapTime(
                  idealMoto
                )
              : "—"}
          </p>
        </div>

      </div>

      {/* DETAILS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">

        <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Weather
          </p>

          <p className="mt-2">
            {session.weather || "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Tire Pressure
          </p>

          <p className="mt-2">
            {session.tire_pressure || "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Shock Setup
          </p>

          <p className="mt-2">
            {session.shock_setup || "—"}
          </p>
        </div>

      </div>

 
{/* MOTO LAPS */}
<div className="mt-10 space-y-6">

  <h2 className="text-sm uppercase tracking-widest text-zinc-500">
    Moto Breakdown
  </h2>

  {/* MOTO 1 */}
  <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-4 md:p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Moto 1
        </p>

        <p className="mt-1 font-mono text-2xl text-white">
          {format(moto1Avg)}
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Best
        </p>

        <p className="mt-1 font-mono text-xl text-red-400">
          {moto1.length
            ? format(Math.min(...moto1))
            : "—"}
        </p>
      </div>

    </div>

    <div className="mt-6 flex flex-wrap gap-2">

      {moto1.map((lap, i) => {

        const isBest =
          lap === Math.min(...moto1);

        const fasterThanAvg =
          moto1Avg !== null &&
          lap < moto1Avg;

        return (
          <span
            key={i}
            className={`rounded-xl border px-2 py-2 md:px-3 font-mono transition ${
              isBest
                ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
                : fasterThanAvg
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-white/5 bg-black/30 text-zinc-300"
            }`}
          >
            {format(lap)}
          </span>
        );
      })}

    </div>

  </div>

  {/* MOTO 2 */}
  {moto2.length > 0 && (

    <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Moto 2
          </p>

          <p className="mt-1 font-mono text-2xl text-white">
            {format(moto2Avg)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Best
          </p>

          <p className="mt-1 font-mono text-xl text-red-400">
            {format(Math.min(...moto2))}
          </p>
        </div>

      </div>

      <div className="mt-6 flex flex-wrap gap-2">

        {moto2.map((lap, i) => {

          const isBest =
            lap === Math.min(...moto2);

          const fasterThanAvg =
            moto2Avg !== null &&
            lap < moto2Avg;

          return (
            <span
              key={i}
              className={`rounded-xl border px-3 py-2 font-mono transition ${
                isBest
                  ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
                  : fasterThanAvg
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : "border-white/5 bg-black/30 text-zinc-300"
              }`}
            >
              {format(lap)}
            </span>
          );
        })}

      </div>

    </div>

  )}

</div>


      {/* CHART */}
      <div className="mt-10 rounded-3xl border border-white/5 bg-zinc-900/20 p-6">

        <h2 className="text-sm uppercase tracking-widest text-zinc-500">
          Lap Progression
        </h2>

        <div className="mt-6">
          <LapChart data={chartData} />
        </div>

      </div>

      
      {/* COMPARE */}
      <SessionCompare
        sessionA={session}
        allSessions={allSessions || []}
      />

    </div>
  );
}


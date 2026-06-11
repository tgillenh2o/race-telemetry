import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LapChart } from "@/components/lap-chart";
import { SessionCompare } from "@/components/session-compare";
import { EditSessionTrigger } from "@/components/edit-session-trigger";
import { ProgressionChart } from "@/components/progression-chart";
import { formatLapTime } from "@/lib/sectors";
import { DeleteSessionButton } from "@/components/delete-session-button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------- TYPES ----------------

type Session = {
  id: string;
  lap_times: string[] | null;
  track_name: string;
  tire_pressure: string;
  shock_setup: string;
  weather: string;
  vehicle: string;
  driver_name?: string;
  session_date?: string;
  event_name?: string;
  notes?: string;
};

// ---------------- HELPERS ----------------

function parseLap(lap: string): number | null {
  if (!lap || typeof lap !== "string") return null;

  if (lap.includes(":")) {
    const [m, s] = lap.split(":").map(Number);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }

  const value = Number(lap);
  return Number.isFinite(value) ? value : null;
}

function average(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function format(sec: number | null): string {
  if (sec === null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------------- PAGE ----------------

export default async function SessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !session) {
    return (
      <div className="p-10 text-white">
        <h1 className="text-xl font-bold">Session not found</h1>
        <p className="mt-2 text-zinc-400">
          {error?.message || "No data returned"}
        </p>
      </div>
    );
  }

  const typedSession = session as Session;

  // ---------------- LAP PARSING ----------------

  const laps: number[] = (typedSession.lap_times ?? [])
    .map(parseLap)
    .filter((v): v is number => typeof v === "number");

  const moto1 = laps.slice(0, 5);
  const moto2 = laps.slice(5, 10);

  const moto1Avg = average(moto1);
  const moto2Avg = average(moto2);

  const bestLap = laps.length ? Math.min(...laps) : null;
  const avgLap = average(laps);

  const consistency =
    laps.length > 1 && avgLap !== null
      ? Math.sqrt(
          laps
            .map((l) => Math.pow(l - avgLap, 2))
            .reduce((a, b) => a + b, 0) / laps.length
        )
      : null;

  // ---------------- MOTO INTELLIGENCE ----------------

  const bestMotoAvg =
    moto1Avg !== null && moto2Avg !== null
      ? Math.min(moto1Avg, moto2Avg)
      : moto1Avg ?? moto2Avg ?? null;

  const idealMoto =
    moto1.length && moto2.length
      ? (Math.min(...moto1) + Math.min(...moto2)) / 2
      : null;

  // ---------------- CHART DATA ----------------

  const chartData = laps.map((lap, index) => ({
    lap: index + 1,
    time: lap,
  }));

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white md:p-8">

      {/* HEADER */}
      <div className="mt-4 flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-red-400"
        >
          ← Back to Dashboard
        </Link>

        <EditSessionTrigger session={typedSession} />

        <DeleteSessionButton sessionId={typedSession.id} />
      </div>

      {/* DETAILS */}
      <div className="mt-6 space-y-2 text-sm">
        <p>Track: {typedSession.track_name}</p>
        <p>Driver: {typedSession.driver_name ?? "—"}</p>
        <p>Vehicle: {typedSession.vehicle}</p>
        <p>Weather: {typedSession.weather}</p>
        <p>Tire Pressure: {typedSession.tire_pressure}</p>
        <p>Shock Setup: {typedSession.shock_setup}</p>
      </div>

      {/* KPI */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">Best Lap</p>
          <p className="font-mono text-lg text-red-400">
            {format(bestLap)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">Avg Lap</p>
          <p className="font-mono text-lg">
            {format(avgLap)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">Consistency</p>
          <p className="font-mono text-lg">
            {consistency ? consistency.toFixed(2) : "—"}
          </p>
        </div>
      </div>

      {/* IDEAL MOTO */}
      <div className="mt-6 rounded-2xl border border-green-500/10 bg-green-500/5 p-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Ideal Moto Avg
        </p>

        <p className="mt-2 font-mono text-2xl text-green-400">
          {idealMoto !== null ? formatLapTime(idealMoto) : "—"}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          Built from fastest laps in each moto
        </p>
      </div>

      {/* LAP LIST */}
      <div className="mt-8">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          Lap Times
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {laps.map((lap, i) => {
            const isBest = bestLap !== null && lap === bestLap;
            const fasterThanAvg = avgLap !== null && lap < avgLap;

            return (
              <span
                key={i}
                className={`rounded-md border px-2 py-1 font-mono text-xs ${
                  isBest
                    ? "border-yellow-400/40 bg-yellow-500/20 text-yellow-300"
                    : fasterThanAvg
                    ? "border-green-500/20 bg-green-500/10 text-green-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                {format(lap)}
              </span>
            );
          })}
        </div>
      </div>

      {/* SESSION COMPARE */}
      <div className="mt-10">
        <SessionCompare
          sessionA={typedSession}
          allSessions={[]}
        />
      </div>

      {/* PROGRESSION CHART */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">
          Lap Progression
        </h2>

        <div className="mt-6">
          <LapChart data={chartData} />
        </div>
      </div>

      {/* RAW ANALYTICS */}
      <div className="mt-10">
        <ProgressionChart data={[]} />
      </div>

    </div>
  );
}
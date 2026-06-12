import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";

import { LapChart } from "@/components/lap-chart";
import { SessionCompare } from "@/components/session-compare";
import { EditSessionTrigger } from "@/components/edit-session-trigger";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { formatLapTime } from "@/lib/sectors";

type Session = {
  id: string;
  user_id: string;
  lap_times: string[] | null;
  track_name: string;
  vehicle: string;
  tire_pressure: string;
  shock_setup: string;
  weather: string;
  driver_name?: string;
  session_date?: string;
  event_name?: string;
};

function parseLap(lap: string): number | null {
  if (!lap) return null;

  if (lap.includes(":")) {
    const [m, s] = lap.split(":").map(Number);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }

  const v = Number(lap);
  return Number.isFinite(v) ? v : null;
}

export default async function SessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // 🔐 AUTH CHECK
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🔐 RLS will enforce ownership automatically
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !session) {
    return (
      <div className="p-10 text-white">
        <h1>Session not found</h1>
      </div>
    );
  }

  const typed = session as Session;

const typedSession = {
  ...session,
  event_name: session.event_name ?? "",
  track_name: session.track_name ?? "",
  vehicle: session.vehicle ?? "",
  session_date: session.session_date ?? "",
};

  // ---------------- LAPS ----------------

  const laps: number[] =
    (typed.lap_times ?? [])
      .map(parseLap)
      .filter((v): v is number => typeof v === "number");

  const bestLap = laps.length ? Math.min(...laps) : null;

  const avgLap = laps.length
    ? laps.reduce((a, b) => a + b, 0) / laps.length
    : null;

  function format(sec: number | null) {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/" className="text-zinc-400">
          ← Back
        </Link>

        <EditSessionTrigger session={typed} />
        <DeleteSessionButton sessionId={typed.id} />
      </div>

      {/* DETAILS */}
      <div className="mt-6 space-y-1 text-sm">
        <p>{typed.track_name}</p>
        <p>{typed.vehicle}</p>
        <p>{typed.weather}</p>
      </div>

      {/* METRICS */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="p-4 border border-white/10 rounded-xl">
          <p className="text-xs text-zinc-500">Best</p>
          <p className="text-red-400 font-mono">
            {format(bestLap)}
          </p>
        </div>

        <div className="p-4 border border-white/10 rounded-xl">
          <p className="text-xs text-zinc-500">Avg</p>
          <p className="font-mono">
            {format(avgLap)}
          </p>
        </div>
      </div>

      {/* LAP LIST */}
      <div className="mt-6 flex flex-wrap gap-2">
        {laps.map((lap, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs font-mono border border-red-500/20 bg-red-500/10 rounded"
          >
            {format(lap)}
          </span>
        ))}
      </div>

      {/* CHART */}
      <div className="mt-10">
        <LapChart
          data={laps.map((l, i) => ({
            lap: i + 1,
            time: l,
          }))}
        />
      </div>

      <SessionCompare sessionA={typedSession} allSessions={[]} />

    </div>
  );
}
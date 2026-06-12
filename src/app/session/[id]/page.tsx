
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";

import { LapChart } from "@/components/lap-chart";
import { SessionCompare } from "@/components/session-compare";
import { EditSessionTrigger } from "@/components/edit-session-trigger";
import { DeleteSessionButton } from "@/components/delete-session-button";

type Session = {
  id: string;
  user_id: string;
  lap_times: string[];
  track_name: string;
  vehicle: string;
  tire_pressure: string;
  shock_setup: string;
  weather: string;
  driver_name: string;
  session_date: string;
  event_name: string;
};

function parseLap(lap: string): number | null {
  if (!lap) return null;

  if (lap.includes(":")) {
    const [m, s] = lap.split(":").map(Number);

    if (Number.isNaN(m) || Number.isNaN(s)) {
      return null;
    }

    return m * 60 + s;
  }

  const value = Number(lap);

  return Number.isFinite(value)
    ? value
    : null;
}

function formatLap(sec: number | null) {
  if (!sec) return "—";

  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // AUTH

// AUTH
const {
  data: { user },
} = await supabase.auth.getUser();

// 🚨 BLOCK if no user
if (!user) {
  redirect("/login");
}

// SESSION
const { data: session, error } = await supabase
  .from("sessions")
  .select("*")
  .eq("id", id)
  .eq("user_id", user.id) // now safe (never undefined)
  .single();

  if (error || !session) {
    return (
      <div className="p-10 text-white">
        <h1 className="text-xl font-bold">
          Session not found
        </h1>
      </div>
    );
  }

  const typedSession: Session = {
    id: session.id,
    user_id: session.user_id,
    lap_times: session.lap_times ?? [],
    track_name: session.track_name ?? "",
    vehicle: session.vehicle ?? "",
    tire_pressure: session.tire_pressure ?? "",
    shock_setup: session.shock_setup ?? "",
    weather: session.weather ?? "",
    driver_name: session.driver_name ?? "",
    session_date: session.session_date ?? "",
    event_name: session.event_name ?? "",
  };

  // LAPS
  const laps: number[] = (
    typedSession.lap_times ?? []
  )
    .map(parseLap)
    .filter(
      (v): v is number =>
        typeof v === "number"
    );

  const bestLap =
    laps.length > 0
      ? Math.min(...laps)
      : null;

  const avgLap =
    laps.length > 0
      ? laps.reduce((a, b) => a + b, 0) /
        laps.length
      : null;

  const chartData = laps.map(
    (lap, index) => ({
      lap: index + 1,
      time: lap,
    })
  );

  return (
    <div className="min-h-screen bg-black p-6 text-white">

      {/* HEADER */}
      <div className="flex items-center gap-4">

        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-red-400"
        >
          ← Back
        </Link>

        <EditSessionTrigger
          session={typedSession}
        />

        <DeleteSessionButton
          sessionId={typedSession.id}
        />

      </div>

      {/* SESSION INFO */}
      <div className="mt-6 space-y-2">

        <h1 className="text-3xl font-bold">
          {typedSession.event_name}
        </h1>

        <p className="text-zinc-400">
          {typedSession.track_name}
        </p>

        <div className="grid gap-2 text-sm text-zinc-300 md:grid-cols-2">

          <p>
            Vehicle: {typedSession.vehicle}
          </p>

          <p>
            Driver: {typedSession.driver_name}
          </p>

          <p>
            Weather: {typedSession.weather}
          </p>

          <p>
            Tire Pressure:{" "}
            {typedSession.tire_pressure}
          </p>

          <p>
            Shock Setup:{" "}
            {typedSession.shock_setup}
          </p>

        </div>
      </div>

      {/* METRICS */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">

          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Best Lap
          </p>

          <p className="mt-2 font-mono text-2xl text-red-400">
            {formatLap(bestLap)}
          </p>

        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">

          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Average
          </p>

          <p className="mt-2 font-mono text-2xl">
            {formatLap(avgLap)}
          </p>

        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">

          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Total Laps
          </p>

          <p className="mt-2 font-mono text-2xl">
            {laps.length}
          </p>

        </div>

      </div>

      {/* LAP LIST */}
      <div className="mt-8">

        <h2 className="text-xs uppercase tracking-widest text-zinc-500">
          Lap Times
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">

          {laps.map((lap, i) => (
            <span
              key={i}
              className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 font-mono text-sm text-red-300"
            >
              {formatLap(lap)}
            </span>
          ))}

        </div>
      </div>

      {/* CHART */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">

        <h2 className="text-xs uppercase tracking-widest text-zinc-500">
          Lap Progression
        </h2>

        <div className="mt-6">
          <LapChart data={chartData} />
        </div>

      </div>

      {/* COMPARE */}
      <div className="mt-10">

        <SessionCompare
          sessionA={typedSession}
          allSessions={[]}
        />

      </div>

    </div>
  );
}


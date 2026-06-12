import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/types/session";
import { AddSessionTrigger } from "@/components/add-session-trigger";
import { RecentSessions } from "@/components/recent-sessions";
import { LapChart } from "@/components/lap-chart";

/* ---------------- HELPERS ---------------- */

function parseLap(lap: string): number | null {
  if (!lap) return null;

  if (lap.includes(":")) {
    const [m, s] = lap.split(":").map(Number);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
    return m * 60 + s;
  }

  const v = Number(lap);
  return Number.isFinite(v) ? v : null;
}

function format(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------------- PAGE ---------------- */

export default async function Page() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
  }

  const safeSessions: Session[] = sessions ?? [];

  /* ---------------- LAP DATA ---------------- */

  const allLaps = safeSessions.flatMap((s) =>
    (s.lap_times ?? [])
      .map(parseLap)
      .filter((v): v is number => v !== null)
  );

  const bestLap = allLaps.length ? Math.min(...allLaps) : null;

  const avgLap = allLaps.length
    ? allLaps.reduce((a, b) => a + b, 0) / allLaps.length
    : null;

  /* ---------------- TRACK RECORDS ---------------- */

  const trackRecords = safeSessions.reduce<Record<string, any>>(
    (acc, session) => {
      const laps = (session.lap_times ?? [])
        .map(parseLap)
        .filter((v): v is number => v !== null);

      if (!laps.length) return acc;

      const best = Math.min(...laps);
      const track = session.track_name || "Unknown Track";

      if (!acc[track] || best < acc[track].bestLap) {
        acc[track] = {
          bestLap: best,
          vehicle: session.vehicle,
        };
      }

      return acc;
    },
    {}
  );

  /* ---------------- DRIVERS ---------------- */

  const drivers = [
    ...new Set(
      safeSessions.map((s) => s.driver_name).filter(Boolean)
    ),
  ];

  /* ---------------- DRIVER RECORDS ---------------- */

  const driverRecords = safeSessions.reduce<Record<string, number>>(
    (acc, session) => {
      const laps = (session.lap_times ?? [])
        .map(parseLap)
        .filter((v): v is number => v !== null);

      if (!laps.length) return acc;

      const best = Math.min(...laps);
      const driver = session.driver_name || "Unknown";

      if (!acc[driver] || best < acc[driver]) {
        acc[driver] = best;
      }

      return acc;
    },
    {}
  );

  /* ---------------- CHART DATA ---------------- */

  const chartData = allLaps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold">Race Dashboard</h1>

        <div className="flex items-center gap-4">
          <AddSessionTrigger />

          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-red-400"
          >
            Sign out
          </Link>
        </div>
      </div>

      {/* MAIN */}
      <div className="p-6 space-y-8">

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-white/10 rounded-xl">
            <p className="text-zinc-500 text-sm">Best Lap</p>
            <p className="text-2xl font-mono text-red-400">
              {format(bestLap)}
            </p>
          </div>

          <div className="p-4 border border-white/10 rounded-xl">
            <p className="text-zinc-500 text-sm">Average Lap</p>
            <p className="text-2xl font-mono">
              {format(avgLap)}
            </p>
          </div>

          <div className="p-4 border border-white/10 rounded-xl">
            <p className="text-zinc-500 text-sm">Sessions</p>
            <p className="text-2xl font-mono">
              {safeSessions.length}
            </p>
          </div>
        </div>

        {/* DRIVER LIST */}
        <div className="flex flex-wrap gap-2">
          {drivers.map((d) => (
            <div
              key={String(d)}
              className="px-3 py-1 border border-red-500/20 rounded-full text-red-300 text-sm"
            >
              {String(d)}
            </div>
          ))}
        </div>

        {/* TRACK RECORDS */}
        <div>
          <h2 className="text-sm text-zinc-500 uppercase">
            Track Records
          </h2>

          <div className="mt-4 grid gap-3">
            {Object.entries(trackRecords).map(([track, data]: any) => (
              <div
                key={track}
                className="p-4 border border-white/10 rounded-xl flex justify-between"
              >
                <div>
                  <p className="font-semibold">{track}</p>
                  <p className="text-sm text-zinc-500">
                    {data.vehicle}
                  </p>
                </div>

                <p className="font-mono text-red-400">
                  {format(data.bestLap)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CHART */}
        <div className="p-6 border border-white/10 rounded-xl">
          <h2 className="text-sm text-zinc-500 uppercase">
            Lap Progression
          </h2>

          <div className="mt-4">
            <LapChart data={chartData} />
          </div>
        </div>

        {/* RECENT */}
        <RecentSessions sessions={safeSessions} />

      </div>
    </div>
  );
}

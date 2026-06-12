import { AddSessionTrigger } from "@/components/add-session-trigger";
import { RecentSessions } from "@/components/recent-sessions";
import { LapChart } from "@/components/lap-chart";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/types/session";

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  // ✅ SAFE USER FETCH (NO DUPLICATES)
 const supabase = await createClient();

const { data, error: userError } =
  await supabase.auth.getUser();
  
  const user = data?.user;

  if (userError) {
    console.error("Auth error:", userError);
  }

  // 🚨 HARD GUARD (prevents UUID crash)
  if (!user?.id) {
    redirect("/login");
  }

  /* ---------------- SESSION QUERY ---------------- */

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
  }

  const safeSessions: Session[] = sessions ?? [];

  /* ---------------- LAPS ---------------- */

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
      const trackKey = session.track_name ?? "Unknown Track";

      const existing = acc[trackKey];

      if (!existing || best < existing.bestLap) {
        acc[trackKey] = {
          bestLap: best,
          vehicle: session.vehicle,
          sessionId: session.id,
        };
      }

      return acc;
    },
    {}
  );

  /* ---------------- DRIVERS ---------------- */

  const drivers = [
    ...new Set(
      safeSessions
        .map((s) => s.driver_name)
        .filter(Boolean)
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

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-white relative">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">
          Stage / Line
        </h1>

        <div className="flex items-center gap-4">
          <AddSessionTrigger />

          <Link
            href="/login"
            className="text-xs text-zinc-500 hover:text-red-400"
          >
            Sign out
          </Link>
        </div>
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500 uppercase">Best</p>
            <p className="text-2xl font-mono text-red-400">
              {format(bestLap)}
            </p>
          </div>

          <div className="p-5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500 uppercase">Avg</p>
            <p className="text-2xl font-mono">
              {format(avgLap)}
            </p>
          </div>

          <div className="p-5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500 uppercase">Sessions</p>
            <p className="text-2xl font-mono">
              {safeSessions.length}
            </p>
          </div>
        </div>

        {/* DRIVER BUBBLES */}
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 text-xs border border-white/10 rounded-full text-zinc-400">
            Drivers
          </div>

          {drivers.map((d) => (
            <div
              key={String(d)}
              className="px-3 py-1 text-xs border border-red-500/20 rounded-full text-red-300"
            >
              {String(d)}
            </div>
          ))}
        </div>

        {/* TRACK RECORDS */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">
            Track Records
          </h2>

          <div className="mt-4 grid gap-4">
            {Object.entries(trackRecords).map(([track, data]: any) => (
              <div
                key={track}
                className="p-5 border border-white/10 rounded-2xl"
              >
                <div className="flex justify-between">
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
              </div>
            ))}
          </div>
        </div>

        {/* LAP CHART */}
        <div className="p-6 border border-white/10 rounded-2xl">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">
            Lap Progression
          </h2>

          <div className="mt-6">
            <LapChart data={chartData} />
          </div>
        </div>

        {/* RECENT */}
        <RecentSessions sessions={safeSessions} />

        {/* DRIVER STATS */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">
            Driver Stats
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {drivers.map((driver) => (
              <div
                key={String(driver)}
                className="p-5 border border-white/10 rounded-2xl"
              >
                <p className="font-semibold">{String(driver)}</p>
                <p className="text-sm text-zinc-500">
                  PR: {format(driverRecords[String(driver)])}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { RecentSessions } from "@/components/recent-sessions";
import { supabase } from "@/lib/supabase";
import { LapChart } from "@/components/lap-chart";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
  }

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect("/login");
}

  const trackRecords =
  sessions?.reduce((acc: any, session: any) => {
    const laps =
      (session.lap_times ?? [])
        .map((lap: string) => {
          const [m, sec] = lap.split(":");

          const minutes = parseInt(m, 10);
          const seconds = parseInt(sec, 10);

          if (
            Number.isNaN(minutes) ||
            Number.isNaN(seconds)
          ) {
            return null;
          }

          return minutes * 60 + seconds;
        })
        .filter(
          (v): v is number => v !== null
        ) ?? [];

    if (!laps.length) return acc;

    const bestLap = Math.min(...laps);

    const existing =
      acc[session.track_name];

    if (
      !existing ||
      bestLap < existing.bestLap
    ) {
      acc[session.track_name] = {
        bestLap,
        vehicle: session.vehicle,
        sessionId: session.id,
      };
    }

    return acc;
  }, {}) ?? {};

  const safeSessions = sessions ?? [];
  const latestSession = safeSessions[0];

  const drivers = [
  ...new Set(
    safeSessions
      .map((s) => s.driver_name)
      .filter(Boolean)
  ),
];

  // ---------------- GROUP BY TRACK ----------------
  const sessionsByTrack = safeSessions.reduce((acc: any, session) => {
    const key = session.track_name || "Unknown Track";
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});

  const setupByTrack = safeSessions.reduce((acc: any, session) => {
    const track = session.track_name || "Unknown Track";
    if (!acc[track]) acc[track] = [];

    acc[track].push({
      tire: session.tire_pressure,
      shock: session.shock_setup,
      weather: session.weather,
      notes: session.driver_notes,
      lap_times: session.lap_times,
    });

    return acc;
  }, {});

  // ---------------- LAP PARSING ----------------
  const rawLaps: string[] = latestSession?.lap_times ?? [];

  const laps = rawLaps
    .map((lap) => {
      if (!lap || typeof lap !== "string") return null;

      if (lap.includes(":")) {
        const [m, s] = lap.split(":").map(Number);
        if (!Number.isNaN(m) && !Number.isNaN(s)) {
          return m * 60 + s;
        }
      }

      const fallback = Number(lap);
      return Number.isFinite(fallback) ? fallback : null;
    })
    .filter((v): v is number => v !== null);

  const chartData = laps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  const allLaps = safeSessions.flatMap((s) => {
    const raw = s.lap_times;
    if (!Array.isArray(raw)) return [];

    return raw
      .map((lap: string) => {
        if (typeof lap !== "string") return null;

        if (lap.includes(":")) {
          const [m, s] = lap.split(":").map(Number);
          if (!Number.isNaN(m) && !Number.isNaN(s)) {
            return m * 60 + s;
          }
        }

        const value = Number(lap);
        return Number.isFinite(value) ? value : null;
      })
      .filter((v): v is number => v !== null);
  });

  const bestLap = allLaps.length ? Math.min(...allLaps) : null;

  const avgLap = allLaps.length
    ? allLaps.reduce((a, b) => a + b, 0) / allLaps.length
    : null;

 function format(sec: number | null) {
  if (!sec) return "—";

  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}
const overallPR =
  allLaps.length
    ? Math.min(...allLaps)
    : null;

const driverRecords =
  safeSessions.reduce(
    (acc: any, session: any) => {

      const laps =
        (session.lap_times ?? [])
          .map((lap: string) => {
            const [m, sec] =
              lap.split(":").map(Number);

            return m * 60 + sec;
          })
          .filter(Boolean);

      if (!laps.length) return acc;

      const bestLap =
        Math.min(...laps);

      const driver =
        session.driver_name ||
        "Unknown Driver";

      if (
        !acc[driver] ||
        bestLap < acc[driver]
      ) {
        acc[driver] = bestLap;
      }

      return acc;

    },
    {}
  );

    const progressionData =
  safeSessions
    .map((session) => {
      const laps =
        (session.lap_times ?? [])
          .map((lap: string) => {
            const [m, sec] =
              lap.split(":").map(Number);

            return m * 60 + sec;
          })
          .filter(Boolean);

      if (!laps.length) return null;

      return {
        date: session.session_date,
        bestLap: Math.min(...laps),
        track: session.track_name,
      };
    })
    .filter(Boolean)
    .reverse();

  // ---------------- SETUP INSIGHTS ----------------
  const setupSessionsFlat = Object.values(setupByTrack).flat();

  function getSetupInsights(
  sessions: any[]
) {
  if (!sessions.length) return [];

  const parsed = sessions.map((s) => {
    const laps =
      (s.lap_times ?? [])
        .map((lap: string) => {
          const [m, sec] =
            lap.split(":").map(Number);

          return m * 60 + sec;
        })
        .filter(Boolean);

    const avgLap =
      laps.reduce(
        (a: number, b: number) => a + b,
        0
      ) / (laps.length || 1);

    return {
      avgLap,
      tire: s.tire,
      shock: s.shock,
      weather: s.weather,
      track: s.track,
    };
  });

  const sorted =
    parsed.sort(
      (a, b) => a.avgLap - b.avgLap
    );

  const best = sorted[0];

  const insights = [];

  if (best?.tire) {
    insights.push(
      `🏁 Fastest sessions favored ${best.tire} PSI tire pressure`
    );
  }

  if (best?.shock) {
    insights.push(
      `⚙️ Best pace came from "${best.shock}" shock setup`
    );
  }

  if (best?.weather) {
    insights.push(
      `☁️ Fastest averages happened in ${best.weather} conditions`
    );
  }

  if (sorted.length >= 3) {
    const consistencyTrend =
      sorted[0].avgLap -
      sorted[sorted.length - 1].avgLap;

    insights.push(
      `📈 Pace spread across sessions: ${consistencyTrend.toFixed(2)} sec`
    );
  }

  insights.push(
    `🔥 Sessions analyzed: ${sessions.length}`
  );

  return insights;
}
  const insights =
  getSetupInsights(setupSessionsFlat);

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.03),transparent_60%)] pointer-events-none" />

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
        <h1 className="flex items-center text-2xl font-bold tracking-tight">
          <span>Stage</span>
          <span className="mx-2 text-red-500 text-3xl">/</span>
          <span>Line</span>
        </h1>

        <div className="flex items-center gap-4">
          <AddSessionTrigger />
          await supabase.auth.signOut();

          <p className="text-xs text-zinc-500 tracking-widest uppercase">
            Race Analytics Platform
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10 relative z-10">

      <div className="flex flex-wrap gap-2">

  <div className="rounded-full border border-white/5 bg-zinc-900/20 px-3 py-1 text-xs uppercase tracking-widest text-zinc-400">
    Drivers
  </div>

  {drivers.map((driver) => (
    <div
      key={String(driver)}
      className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-widest text-red-300"
    >
      {String(driver)}
    </div>
  ))}

</div>

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/20">
            <p className="text-xs text-zinc-500 uppercase">Best</p>
            <p className="text-2xl font-mono text-zinc-300">{format(bestLap)}</p>
          </div>

          <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/20">
            <p className="text-xs text-zinc-500 uppercase">Avg</p>
            <p className="text-2xl font-mono">{format(avgLap)}</p>
          </div>

	 
          <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/20">
            <p className="text-xs text-zinc-500 uppercase">Sessions</p>
            <p className="text-2xl font-mono">{safeSessions.length}</p>
          </div>
        </div>
     
        {/* PERSONAL RECORDS */}
<div className="space-y-6">

  <h2 className="text-xs uppercase tracking-widest text-zinc-500">
    Personal Records
  </h2>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

    {/* OVERALL */}
    <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-5">

      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Overall PR
      </p>

      <p className="mt-2 font-mono text-3xl text-yellow-400">
        {format(overallPR)}
      </p>

    </div>

    {/* DRIVER PRS */}
    {Object.entries(driverRecords).map(
      ([driver, lap]: any) => (

        <div
          key={driver}
          className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5"
        >

          <p className="text-xs uppercase tracking-widest text-zinc-500">
            {driver}
          </p>

          <p className="mt-2 font-mono text-3xl text-red-400">
            {format(lap)}
          </p>

        </div>
      )
    )}

  </div>

</div>

        {/* CHART */}
        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">
            Lap Progression
          </h2>

          <div className="mt-6">
            <LapChart data={chartData} />
          </div>
        </div>

 {/* TRACK RECORDS */}
<div className="mt-10">

  <h2 className="text-sm uppercase tracking-widest text-zinc-500">
    Track Records
  </h2>

  <div className="mt-4 grid gap-4">

    {Object.entries(trackRecords).map(
      ([track, data]: any) => (

        <div
          key={track}
          className="rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-5"
        >

          <div className="flex items-center justify-between">

            <div>
              <p className="text-lg font-semibold">
                {track}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {data.vehicle}
              </p>
            </div>

            <p className="font-mono text-2xl text-yellow-400">
              {format(data.bestLap)}
            </p>

          </div>

        </div>
      )
    )}

  </div>

</div>
         {/* PROGRESSION */}
<div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-6">

  <h2 className="text-xs uppercase tracking-widest text-zinc-500">
    Pace Progression
  </h2>

  <div className="mt-6">

    <LapChart
      data={progressionData.map(
        (d, i) => ({
          lap: i + 1,
          time: d.bestLap,
        })
      )}
    />

  </div>

</div>
      
       <RecentSessions sessions={safeSessions} />


        {/* TRACK HISTORY */}
        <div className="space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">
            Track History
          </h2>

          {Object.entries(sessionsByTrack).map(([track, sessions]: any) => (
            <div
              key={track}
              className="p-5 rounded-2xl border border-white/5 bg-zinc-900/30"
            >
              <h3 className="text-lg font-semibold">{track}</h3>
              <p className="text-sm text-zinc-500">
                Sessions: {sessions.length}
              </p>
            </div>
          ))}
        </div>


        {/* DRIVER STATS */}
<div className="space-y-6">

  <h2 className="text-xs uppercase tracking-widest text-zinc-500">
    Driver Stats
  </h2>

  <div className="grid gap-4 md:grid-cols-3">

    {drivers.map((driver) => {
      const driverSessions =
        safeSessions.filter(
          (s) => s.driver_name === driver
        );

      const driverLaps =
        driverSessions.flatMap((s) =>
          (s.lap_times ?? [])
            .map((lap: string) => {
              const [m, sec] =
                lap.split(":").map(Number);

              return m * 60 + sec;
            })
            .filter(Boolean)
        );

      const best =
        driverLaps.length
          ? Math.min(...driverLaps)
          : null;

      return (
        <div
          key={String(driver)}
          className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5"
        >

          <div className="flex items-center justify-between">

            <div>
              <p className="text-lg font-semibold">
                {String(driver)}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Sessions: {driverSessions.length}
              </p>
            </div>

            <p className="font-mono text-2xl text-red-400">
              {format(best)}
            </p>

          </div>

        </div>
      );
    })}

  </div>

</div>

        {/* INSIGHTS */}
        {insights.length > 0 && (
          <div className="p-5 rounded-2xl border border-red-500/10 bg-red-500/5">
            <h2 className="text-xs uppercase tracking-widest text-red-400">
              Race Insights
            </h2>

            <div className="mt-3 space-y-2">
              {insights.map((i, idx) => (
                <p key={idx} className="text-sm text-zinc-300">
                  {i}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* RECENT */}
       
      </main>
    </div>
  );
}
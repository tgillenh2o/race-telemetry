import { createSupabaseServer } from "@/lib/supabase-server";
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
 const supabase = createSupabaseServer();

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
    <div className="min-h-screen bg-black text-white
bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.12),transparent_35%)]">

      {/* HEADER */}
      <h1 className="text-2xl font-black tracking-[0.25em] text-white">
  <span className="text-red-500 drop-shadow-[0_0_18px_rgba(255,0,0,0.9)]">
    STAGE
  </span>
  <span className="text-zinc-300"> / LINE</span>
</h1>

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
          <div className="
p-5
rounded-2xl
border border-red-500/10
bg-zinc-950/40
backdrop-blur-md
shadow-[0_0_25px_rgba(255,0,0,0.08)]
hover:shadow-[0_0_35px_rgba(255,0,0,0.18)]
transition-all duration-300
"
            <p className="text-zinc-500 text-sm">Best Lap</p>
            <p className="
text-3xl
font-mono
font-bold
text-red-400
drop-shadow-[0_0_15px_rgba(255,0,0,0.7)]
"
              {format(bestLap)}
            </p>
          </div>

          <div className="
p-5
rounded-2xl
border border-red-500/10
bg-zinc-950/40
backdrop-blur-md
shadow-[0_0_25px_rgba(255,0,0,0.08)]
hover:shadow-[0_0_35px_rgba(255,0,0,0.18)]
transition-all duration-300
"
            <p className="text-zinc-500 text-sm">Average Lap</p>
            <p className="text-2xl font-mono">
              {format(avgLap)}
            </p>
          </div>

          <div className="
p-5
rounded-2xl
border border-red-500/10
bg-zinc-950/40
backdrop-blur-md
shadow-[0_0_25px_rgba(255,0,0,0.08)]
hover:shadow-[0_0_35px_rgba(255,0,0,0.18)]
transition-all duration-300
"
            <p className="text-zinc-500 text-sm">Sessions</p>
            <p className="text-2xl font-mono">
              {safeSessions.length}
            </p>
          </div>
        </div>

        {/* DRIVER LIST */}
        <div className="
px-4
py-1.5
rounded-full
border border-red-500/20
bg-red-500/5
text-red-300
text-xs
tracking-wider
shadow-[0_0_15px_rgba(255,0,0,0.12)]
hover:bg-red-500/10
hover:scale-105
transition-all
"
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
                className="
p-5
rounded-2xl
border border-white/5
bg-zinc-950/40
shadow-[0_0_30px_rgba(255,0,0,0.06)]
hover:border-red-500/20
hover:shadow-[0_0_40px_rgba(255,0,0,0.15)]
transition-all duration-300
flex justify-between items-center
"
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
        <div className="
p-6
rounded-2xl
border border-white/5
bg-zinc-950/40
shadow-[0_0_35px_rgba(255,0,0,0.08)]
"
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

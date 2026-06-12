import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { AddSessionTrigger } from "@/components/add-session-trigger";
import { RecentSessions } from "@/components/recent-sessions";
import { LapChart } from "@/components/lap-chart";
import type { Session } from "@/types/session";

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

  if (!user) redirect("/login");

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error(error);

  const safeSessions: Session[] = sessions ?? [];

  const allLaps = safeSessions.flatMap((s) =>
    (s.lap_times ?? [])
      .map(parseLap)
      .filter((v): v is number => v !== null)
  );

  const bestLap = allLaps.length ? Math.min(...allLaps) : null;

  const avgLap = allLaps.length
    ? allLaps.reduce((a, b) => a + b, 0) / allLaps.length
    : null;

  const chartData = allLaps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stage / Line</h1>

        <AddSessionTrigger />
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-xs text-zinc-500">Best Lap</p>
          <p className="text-2xl text-red-400 font-mono">
            {format(bestLap)}
          </p>
        </div>

        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-xs text-zinc-500">Average</p>
          <p className="text-2xl font-mono">{format(avgLap)}</p>
        </div>

        <div className="p-5 border border-white/10 rounded-xl">
          <p className="text-xs text-zinc-500">Sessions</p>
          <p className="text-2xl font-mono">{safeSessions.length}</p>
        </div>
      </div>

      {/* CHART */}
      <div className="p-6 border border-white/10 rounded-2xl">
        <h2 className="text-xs uppercase text-zinc-500">
          Lap Progression
        </h2>

        <div className="mt-6">
          <LapChart data={chartData} />
        </div>
      </div>

      {/* RECENT */}
      <RecentSessions sessions={safeSessions} />
    </div>
  );
}

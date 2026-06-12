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

    if (!Number.isFinite(m) || !Number.isFinite(s)) {
      return null;
    }

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

  /* ---------------- SESSIONS ---------------- */

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

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

  const bestLap =
    allLaps.length > 0
      ? Math.min(...allLaps)
      : null;

  const avgLap =
    allLaps.length > 0
      ? allLaps.reduce((a, b) => a + b, 0) /
        allLaps.length
      : null;

  /* ---------------- CHART ---------------- */

  const chartData = allLaps.map((time, i) => ({
    lap: i + 1,
    time,
  }));

  /* ---------------- TRACK RECORDS ---------------- */

  const trackRecords = safeSessions.reduce<
    Record<
      string,
      {
        bestLap: number;
        vehicle: string;
      }
    >
  >((acc, session) => {
    const laps = (session.lap_times ?? [])
      .map(parseLap)
      .filter((v): v is number => v !== null);

    if (!laps.length) return acc;

    const best = Math.min(...laps);

    const track =
      session.track_name ||
      "Unknown Track";

    if (
      !acc[track] ||
      best < acc[track].bestLap
    ) {
      acc[track] = {
        bestLap: best,
        vehicle: session.vehicle || "",
      };
    }

    return acc;
  }, {});

  /* ---------------- DRIVERS ---------------- */

  const drivers = [
    ...new Set(
      safeSessions
        .map((s) => s.driver_name)
        .filter(Boolean)
    ),
  ];

  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.12),transparent_35%)]
      "
    >

      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-white/5
          px-6
          py-5
        "
      >
        <div>
          <h1
            className="
              text-2xl
              font-black
              tracking-[0.25em]
              text-white
            "
          >
            <span
              className="
                text-red-500
                drop-shadow-[0_0_18px_rgba(255,0,0,0.9)]
              "
            >
              STAGE
            </span>

            <span className="text-zinc-300">
              {" "}
              / LINE
            </span>
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Racing telemetry dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <AddSessionTrigger />

          <Link
            href="/login"
            className="
              text-sm
              text-zinc-400
              hover:text-red-400
              transition
            "
          >
            Sign out
          </Link>
        </div>
      </div>

      {/* MAIN */}

      <main className="space-y-8 p-6">

        {/* STATS */}

        <div className="grid gap-4 md:grid-cols-3">

          {/* BEST */}

          <div
            className="
              rounded-2xl
              border
              border-red-500/10
              bg-zinc-950/40
              p-5
              backdrop-blur-md
              shadow-[0_0_25px_rgba(255,0,0,0.08)]
              transition-all
              duration-300
              hover:shadow-[0_0_35px_rgba(255,0,0,0.18)]
            "
          >
            <p className="text-sm text-zinc-500">
              Best Lap
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                font-mono
                text-red-400
                drop-shadow-[0_0_15px_rgba(255,0,0,0.7)]
              "
            >
              {format(bestLap)}
            </p>
          </div>

          {/* AVG */}

          <div
            className="
              rounded-2xl
              border
              border-red-500/10
              bg-zinc-950/40
              p-5
              backdrop-blur-md
              shadow-[0_0_25px_rgba(255,0,0,0.08)]
            "
          >
            <p className="text-sm text-zinc-500">
              Average Lap
            </p>

            <p className="mt-2 text-3xl font-mono">
              {format(avgLap)}
            </p>
          </div>

          {/* SESSIONS */}

          <div
            className="
              rounded-2xl
              border
              border-red-500/10
              bg-zinc-950/40
              p-5
              backdrop-blur-md
              shadow-[0_0_25px_rgba(255,0,0,0.08)]
            "
          >
            <p className="text-sm text-zinc-500">
              Sessions
            </p>

            <p className="mt-2 text-3xl font-mono">
              {safeSessions.length}
            </p>
          </div>

        </div>

        {/* DRIVERS */}

        <div className="flex flex-wrap gap-2">

          {drivers.map((driver) => (
            <div
              key={String(driver)}
              className="
                rounded-full
                border
                border-red-500/20
                bg-red-500/5
                px-4
                py-1.5
                text-xs
                tracking-wider
                text-red-300
                shadow-[0_0_15px_rgba(255,0,0,0.12)]
                transition-all
                hover:scale-105
                hover:bg-red-500/10
              "
            >
              {String(driver)}
            </div>
          ))}

        </div>

        {/* TRACK RECORDS */}

        <div>

          <h2
            className="
              text-xs
              uppercase
              tracking-widest
              text-zinc-500
            "
          >
            Track Records
          </h2>

          <div className="mt-4 grid gap-3">

            {Object.entries(trackRecords).map(
              ([track, data]) => (
                <div
                  key={track}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-white/5
                    bg-zinc-950/40
                    p-5
                    shadow-[0_0_30px_rgba(255,0,0,0.06)]
                    transition-all
                    duration-300
                    hover:border-red-500/20
                    hover:shadow-[0_0_40px_rgba(255,0,0,0.15)]
                  "
                >
                  <div>
                    <p className="font-semibold">
                      {track}
                    </p>

                    <p className="text-sm text-zinc-500">
                      {data.vehicle}
                    </p>
                  </div>

                  <p className="font-mono text-red-400">
                    {format(data.bestLap)}
                  </p>
                </div>
              )
            )}

          </div>

        </div>

        {/* LAP CHART */}

        <div
          className="
            rounded-2xl
            border
            border-white/5
            bg-zinc-950/40
            p-6
            shadow-[0_0_35px_rgba(255,0,0,0.08)]
          "
        >
          <h2
            className="
              text-xs
              uppercase
              tracking-widest
              text-zinc-500
            "
          >
            Lap Progression
          </h2>

          <div className="mt-6">
            <LapChart data={chartData} />
          </div>
        </div>

        {/* RECENT SESSIONS */}

        <RecentSessions sessions={safeSessions} />

      </main>
    </div>
  );
}

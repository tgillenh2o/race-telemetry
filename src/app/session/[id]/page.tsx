import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { LapChart } from "@/components/lap-chart";

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

  driver_notes?: string;

  session_date: string;
  event_name: string;
};

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

/* ---------------- PAGE ---------------- */

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createSupabaseServer();

  /* ---------------- AUTH ---------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* ---------------- SESSION ---------------- */

  const { data: session, error } =
    await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

  if (error || !session) {
    return (
      <div className="p-10 text-white">
        Session not found
      </div>
    );
  }

  const typedSession: Session = {
    id: session.id,
    user_id: session.user_id,

    lap_times: session.lap_times ?? [],

    track_name: session.track_name ?? "",
    vehicle: session.vehicle ?? "",

    tire_pressure:
      session.tire_pressure ?? "",

    shock_setup:
      session.shock_setup ?? "",

    weather: session.weather ?? "",

    driver_name:
      session.driver_name ?? "",

    driver_notes:
      session.driver_notes ?? "",

    session_date:
      session.session_date ?? "",

    event_name:
      session.event_name ?? "",
  };

  /* ---------------- LAPS ---------------- */

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

    /* ---------------- PREVIOUS SESSION ---------------- */

const { data: previousSessions } = await supabase
  .from("sessions")
  .select("*")
  .eq("user_id", user.id)
  .neq("id", id)
  .order("created_at", {
    ascending: false,
  })
  .limit(1);

const previousSession =
  previousSessions?.[0];

let intelligenceMessage =
  "Not enough session data yet.";

if (previousSession) {
  const previousLaps = (
    previousSession.lap_times ?? []
  )
    .map(parseLap)
   .filter(
  (v: number | null): v is number =>
    typeof v === "number"
);

  const previousBest =
    previousLaps.length > 0
      ? Math.min(...previousLaps)
      : null;

  if (
    previousBest !== null &&
    bestLap !== null
  ) {
    const delta =
      previousBest - bestLap;

    if (delta > 0) {
      intelligenceMessage =
        `You went ${delta.toFixed(
          2
        )} seconds faster than your previous session.`;
    } else if (delta < 0) {
      intelligenceMessage =
        `You were ${Math.abs(
          delta
        ).toFixed(
          2
        )} seconds slower than your previous session.`;
    } else {
      intelligenceMessage =
        "You matched your previous best lap exactly.";
    }
  }
}

  /* ---------------- INTELLIGENCE ---------------- */

  const consistency =
    laps.length > 1
      ? Math.max(...laps) -
        Math.min(...laps)
      : null;

  const consistencyText =
    consistency !== null &&
    consistency < 2
      ? "Extremely Consistent"
      : consistency !== null &&
        consistency < 4
      ? "Consistent"
      : "Needs More Consistency";

  /* ---------------- UI ---------------- */

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
          <Link
            href="/"
            className="
              text-sm
              text-zinc-500
              hover:text-red-400
              transition
            "
          >
            ← Back to Dashboard
          </Link>

          <h1
            className="
              mt-3
              text-3xl
              font-black
              tracking-wide
            "
          >
            {typedSession.event_name}
          </h1>

          <p className="mt-1 text-zinc-500">
            {typedSession.track_name}
          </p>
        </div>

        <div
          className="
            rounded-full
            border
            border-red-500/20
            bg-red-500/5
            px-4
            py-2
            text-xs
            tracking-widest
            text-red-300
            shadow-[0_0_15px_rgba(255,0,0,0.12)]
          "
        >
          SESSION ANALYSIS
        </div>

      </div>

      {/* MAIN */}

      <main className="space-y-8 p-6">

        {/* KPI */}

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
              {formatLap(bestLap)}
            </p>
          </div>

          {/* AVG */}

          <div
            className="
              rounded-2xl
              border
              border-white/5
              bg-zinc-950/40
              p-5
            "
          >
            <p className="text-sm text-zinc-500">
              Average Lap
            </p>

            <p className="mt-2 text-3xl font-mono">
              {formatLap(avgLap)}
            </p>
          </div>

          {/* CONSISTENCY */}

          <div
            className="
              rounded-2xl
              border
              border-white/5
              bg-zinc-950/40
              p-5
            "
          >
            <p className="text-sm text-zinc-500">
              Consistency
            </p>

            <p className="mt-2 text-lg font-semibold">
              {consistencyText}
            </p>
          </div>

        </div>

        {/* SESSION INFO */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-white/5
              bg-zinc-950/40
              p-6
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
              Driver + Vehicle
            </h2>

            <div className="mt-4 space-y-3">

              <div>
                <p className="text-zinc-500 text-sm">
                  Driver
                </p>

                <p className="font-semibold">
                  {typedSession.driver_name ||
                    "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 text-sm">
                  Vehicle
                </p>

                <p className="font-semibold">
                  {typedSession.vehicle}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 text-sm">
                  Weather
                </p>

                <p className="font-semibold">
                  {typedSession.weather}
                </p>
              </div>

            </div>
          </div>

          {/* SETUP */}

          <div
            className="
              rounded-2xl
              border
              border-white/5
              bg-zinc-950/40
              p-6
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
              Vehicle Setup
            </h2>

            <div className="mt-4 space-y-3">

              <div>
                <p className="text-zinc-500 text-sm">
                  Tire Pressure
                </p>

                <p className="font-semibold">
                  {typedSession.tire_pressure ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 text-sm">
                  Shock Setup
                </p>

                <p className="font-semibold">
                  {typedSession.shock_setup ||
                    "—"}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* SESSION INTELLIGENCE */}

<div
  className="
    rounded-2xl
    border
    border-red-500/10
    bg-zinc-950/40
    p-6
    shadow-[0_0_35px_rgba(255,0,0,0.08)]
  "
>
  <div className="flex items-center justify-between">
    <h2
      className="
        text-xs
        uppercase
        tracking-widest
        text-zinc-500
      "
    >
      Session Intelligence
    </h2>

    <div
      className="
        rounded-full
        border
        border-red-500/20
        bg-red-500/10
        px-3
        py-1
        text-[10px]
        tracking-widest
        text-red-300
      "
    >
      RACE AI
    </div>
  </div>

  <div className="mt-5 space-y-4">

    <div>
      <p className="text-zinc-500 text-sm">
        Performance Delta
      </p>

      <p
        className="
          mt-1
          text-lg
          font-semibold
          text-white
        "
      >
        {intelligenceMessage}
      </p>
    </div>

    <div
      className="
        rounded-xl
        border
        border-white/5
        bg-black/30
        p-4
      "
    >
      <p className="text-sm text-zinc-400">
        Session analysis compares your
        latest performance against your
        most recent logged session to
        identify pace changes and setup
        trends.
      </p>
    </div>

  </div>
</div>

        {/* NOTES */}

        <div
          className="
            rounded-2xl
            border
            border-white/5
            bg-zinc-950/40
            p-6
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
            Driver Notes
          </h2>

          <p className="mt-4 leading-7 text-zinc-300">
            {typedSession.driver_notes ||
              "No notes added for this session."}
          </p>
        </div>

        {/* LAP TIMES */}

        <div
          className="
            rounded-2xl
            border
            border-white/5
            bg-zinc-950/40
            p-6
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
            Lap Times
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">

            {laps.map((lap, i) => (
              <div
                key={i}
                className="
                  rounded-full
                  border
                  border-red-500/20
                  bg-red-500/5
                  px-4
                  py-2
                  font-mono
                  text-red-300
                  shadow-[0_0_15px_rgba(255,0,0,0.12)]
                "
              >
                {formatLap(lap)}
              </div>
            ))}

          </div>
        </div>

        {/* CHART */}

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

      </main>
    </div>
  );
}

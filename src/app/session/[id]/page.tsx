import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AddSessionTrigger } from "@/components/add-session-trigger";
import { LapChart } from "@/components/lap-chart";

import type { Session } from "@/types/session";

/* ---------------- HELPERS ---------------- */

function parseLap(
  lap: string
): number | null {
  if (!lap) return null;

  if (lap.includes(":")) {
    const [m, s] = lap
      .split(":")
      .map(Number);

    if (
      !Number.isFinite(m) ||
      !Number.isFinite(s)
    ) {
      return null;
    }

    return m * 60 + s;
  }

  const v = Number(lap);

  return Number.isFinite(v)
    ? v
    : null;
}

function formatLap(
  sec: number | null
) {
  if (!sec) return "—";

  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(
    2,
    "0"
  )}`;
}

/* ---------------- PAGE ---------------- */

export default async function SessionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase =
    createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* ---------------- SESSION ---------------- */

  const { data, error } =
    await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

  if (error || !data) {
    redirect("/");
  }

  const session =
    data as Session;

  /* ---------------- LAPS ---------------- */

  const laps = (
    session.lap_times ?? []
  )
    .map(parseLap)
    .filter(
      (
        v: number | null
      ): v is number =>
        v !== null
    );

  const bestLap =
    laps.length > 0
      ? Math.min(...laps)
      : null;

  const avgLap =
    laps.length > 0
      ? laps.reduce(
          (a, b) => a + b,
          0
        ) / laps.length
      : null;

  const chartData = laps.map(
    (lap, index) => ({
      lap: index + 1,
      time: lap,
    })
  );
/* ---------------- RACE ENGINEER ---------------- */

const fastestLap = bestLap ?? 0;
const slowestLap = laps.length ? Math.max(...laps) : 0;

const spread = slowestLap - fastestLap;

let consistency = "Needs Work";

if (spread < 0.3) {
  consistency = "Elite";
} else if (spread < 0.6) {
  consistency = "Excellent";
} else if (spread < 1) {
  consistency = "Good";
} else if (spread < 2) {
  consistency = "Fair";
}

const recommendation =
  consistency === "Elite"
    ? "Excellent consistency. Keep this setup."
    : consistency === "Excellent"
    ? "Very consistent session. Minor tuning only."
    : consistency === "Good"
    ? "Car looks good. Focus on repeatability."
    : "Large lap spread detected. Work on consistency before changing setup.";
  /* ---------------- PREVIOUS SESSION ---------------- */

  const {
    data: previousSessions,
  } = await supabase
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

  /* ---------------- SESSION INTELLIGENCE ---------------- */

  let intelligenceMessage =
    "Not enough session data yet.";

  if (previousSession) {
    const previousLaps = (
      previousSession.lap_times ??
      []
    )
      .map(parseLap)
      .filter(
        (
          v: number | null
        ): v is number =>
          v !== null
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

  /* ---------------- BADGES ---------------- */

  const {
    data: allSessions,
  } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id);

  const allBestLaps = (
    allSessions ?? []
  ).flatMap((s) =>
    (s.lap_times ?? [])
      .map(parseLap)
      .filter(
        (
          v: number | null
        ): v is number =>
          v !== null
      )
  );

  const overallBest =
    allBestLaps.length > 0
      ? Math.min(...allBestLaps)
      : null;

  const isPersonalRecord =
    bestLap !== null &&
    overallBest !== null &&
    bestLap <= overallBest;

  const consistencyScore =
    laps.length > 1
      ? Math.max(...laps) -
        Math.min(...laps)
      : null;

  const isConsistent =
    consistencyScore !== null &&
    consistencyScore < 2;

  const improvedSession =
    intelligenceMessage.includes(
      "faster"
    );

  /* ---------------- SETUP INTELLIGENCE ---------------- */

  const tirePressureValue =
    parseFloat(
      session.tire_pressure ||
        "0"
    );

  let setupInsight =
    "Not enough setup data yet.";

  const sessionsWithPressure =
    (
      allSessions ?? []
    ).filter((s) => {
      return (
        s.tire_pressure &&
        !isNaN(
          parseFloat(
            s.tire_pressure
          )
        )
      );
    });

  if (
    sessionsWithPressure.length >=
      3 &&
    bestLap !== null
  ) {
    const fasterSessions =
      sessionsWithPressure.filter(
        (s) => {
          const laps = (
            s.lap_times ?? []
          )
            .map(parseLap)
            .filter(
              (
                v:
                  | number
                  | null
              ): v is number =>
                v !== null
            );

          if (!laps.length) {
            return false;
          }

          const best =
            Math.min(...laps);

          return (
            best <=
            bestLap + 1
          );
        }
      );

    const avgPressure =
      fasterSessions.reduce(
        (acc, s) => {
          return (
            acc +
            parseFloat(
              s.tire_pressure ||
                "0"
            )
          );
        },
        0
      ) /
      Math.max(
        fasterSessions.length,
        1
      );

    if (
      tirePressureValue >
      avgPressure + 1
    ) {
      setupInsight =
        "Your fastest sessions tend to use lower tire pressures.";
    } else if (
      tirePressureValue <
      avgPressure - 1
    ) {
      setupInsight =
        "You may benefit from slightly higher tire pressure for stability.";
    } else {
      setupInsight =
        "Your tire pressure is aligned with your fastest sessions.";
    }
  }

  /* ---------------- SESSION COMPARISON ---------------- */

  let comparisonData: {
    bestLapDelta:
      | number
      | null;
    previousVehicle: string;
    previousPressure: string;
    previousShock: string;
    previousBest:
      | number
      | null;
  } | null = null;

  if (previousSession) {
    const previousLaps = (
      previousSession.lap_times ??
      []
    )
      .map(parseLap)
      .filter(
        (
          v: number | null
        ): v is number =>
          v !== null
      );

    const previousBest =
      previousLaps.length > 0
        ? Math.min(
            ...previousLaps
          )
        : null;

    comparisonData = {
      bestLapDelta:
        bestLap !== null &&
        previousBest !== null
          ? previousBest -
            bestLap
          : null,

      previousVehicle:
        previousSession.vehicle ??
        "—",

      previousPressure:
        previousSession.tire_pressure ??
        "—",

      previousShock:
        previousSession.shock_setup ??
        "—",

      previousBest,
    };
  }

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
          py-4
        "
      >
        <Link
          href="/"
          className="
            text-sm
            text-zinc-400
            hover:text-red-400
          "
        >
          ← Back
        </Link>

        <AddSessionTrigger />
      </div>

      {/* MAIN */}

      <div className="mx-auto max-w-6xl p-6 space-y-8">

        {/* TITLE */}

        <div>
          <h1
            className="
              text-4xl
              font-black
              tracking-[0.2em]
            "
          >
            <span
              className="
                text-red-500
                drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]
              "
            >
              SESSION
            </span>
          </h1>

          <p className="mt-2 text-zinc-500">
            {session.track_name}
          </p>
        </div>

        {/* BADGES */}

        <div className="flex flex-wrap gap-3">

          {isPersonalRecord && (
            <div
              className="
                rounded-full
                border
                border-yellow-500/20
                bg-yellow-500/10
                px-4
                py-2
                text-sm
                font-semibold
                text-yellow-300
              "
            >
              🏁 PERSONAL RECORD
            </div>
          )}

          {improvedSession && (
            <div
              className="
                rounded-full
                border
                border-green-500/20
                bg-green-500/10
                px-4
                py-2
                text-sm
                font-semibold
                text-green-300
              "
            >
              📈 IMPROVED PACE
            </div>
          )}

          {isConsistent && (
            <div
              className="
                rounded-full
                border
                border-blue-500/20
                bg-blue-500/10
                px-4
                py-2
                text-sm
                font-semibold
                text-blue-300
              "
            >
              🎯 MOST CONSISTENT
            </div>
          )}

        </div>

        {/* STATS */}

        <div className="grid gap-4 md:grid-cols-3">

          <div
            className="
              rounded-2xl
              border
              border-red-500/10
              bg-zinc-950/40
              p-6
            "
          >
            <p className="text-zinc-500 text-sm">
              Best Lap
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                font-mono
                text-red-400
              "
            >
              {formatLap(bestLap)}
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-white/5
              bg-zinc-950/40
              p-6
            "
          >
            <p className="text-zinc-500 text-sm">
              Average Lap
            </p>

            <p className="mt-2 text-3xl font-mono">
              {formatLap(avgLap)}
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-white/5
              bg-zinc-950/40
              p-6
            "
          >
            <p className="text-zinc-500 text-sm">
              Total Laps
            </p>

            <p className="mt-2 text-3xl font-mono">
              {laps.length}
            </p>
          </div>

        </div>

     {/* RACE ENGINEER */}

<div
  className="
    rounded-2xl
    border
    border-red-500/20
    bg-gradient-to-br
    from-zinc-950/80
    to-black
    p-6
  "
>

  <div className="flex items-center justify-between">

    <h2
      className="
        text-xs
        uppercase
        tracking-[0.3em]
        text-red-400
      "
    >
      🏁 Race Engineer
    </h2>

    <span className="text-xs text-zinc-500">
      AI Analysis
    </span>

  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2">

    <div className="rounded-xl border border-white/5 bg-black/30 p-5">
      <p className="text-xs uppercase text-zinc-500">
        Consistency
      </p>

      <p className="mt-2 text-3xl font-bold">
        {consistency}
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        Spread {spread.toFixed(2)} sec
      </p>
    </div>

    <div className="rounded-xl border border-white/5 bg-black/30 p-5">
      <p className="text-xs uppercase text-zinc-500">
        Fastest Lap
      </p>

      <p className="mt-2 text-3xl font-mono text-red-400">
        {formatLap(bestLap)}
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        Average {formatLap(avgLap)}
      </p>
    </div>

  </div>

  <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-5">

    <p className="text-xs uppercase text-zinc-500">
      Recommendation
    </p>

    <p className="mt-3 text-lg leading-8">
      {recommendation}
    </p>

  </div>

  <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/5 p-5">

    <p className="text-xs uppercase tracking-widest text-red-400">
      Insight
    </p>

    <p className="mt-3 text-lg">
      {intelligenceMessage}
    </p>

  </div>

</div>

        {/* SETUP INTELLIGENCE */}

        <div
          className="
            rounded-2xl
            border
            border-red-500/10
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
            Setup Intelligence
          </h2>

          <p
            className="
              mt-4
              text-lg
              leading-8
            "
          >
            {setupInsight}
          </p>
        </div>

        {/* SESSION COMPARISON */}

        {comparisonData && (
          <div
            className="
              rounded-2xl
              border
              border-red-500/10
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
              Session Comparison
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div
                className="
                  rounded-xl
                  border
                  border-white/5
                  bg-black/30
                  p-5
                "
              >
                <p className="text-sm text-zinc-500">
                  Best Lap Delta
                </p>

                <p
                  className={`
                    mt-2
                    text-3xl
                    font-bold
                    ${
                      (
                        comparisonData.bestLapDelta ??
                        0
                      ) > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  `}
                >
                  {(
                    comparisonData.bestLapDelta ??
                    0
                  ) > 0
                    ? "+"
                    : ""}
                  {comparisonData.bestLapDelta?.toFixed(
                    2
                  )}
                  s
                </p>

              </div>

              <div
                className="
                  rounded-xl
                  border
                  border-white/5
                  bg-black/30
                  p-5
                "
              >
                <p className="text-sm text-zinc-500">
                  Previous Setup
                </p>

                <div className="mt-4 space-y-3">

                  <div>
                    <p className="text-xs text-zinc-500">
                      Vehicle
                    </p>

                    <p>
                      {
                        comparisonData.previousVehicle
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">
                      Tire Pressure
                    </p>

                    <p>
                      {
                        comparisonData.previousPressure
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">
                      Shock Setup
                    </p>

                    <p>
                      {
                        comparisonData.previousShock
                      }
                    </p>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* CHART */}

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
            Lap Progression
          </h2>

          <div className="mt-6">
            <LapChart
              data={chartData}
            />
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

          <p className="mt-4 leading-8 text-zinc-300">
            {session.notes ||
              "No notes recorded."}
          </p>
        </div>

      </div>
    </div>
  );
}

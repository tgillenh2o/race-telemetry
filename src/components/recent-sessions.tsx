import Link from "next/link";

type Session = {
  id: string;
  event_name: string;
  track_name: string;
  session_date: string;
  vehicle: string;
  notes: string;
  weather: string;
  tire_pressure: string;
  shock_setup: string;
  lap_times: string[];
  driver_name?: string;
};

type Props = {
  sessions: Session[];
};

export function RecentSessions({
  sessions,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">

      <div className="flex items-center justify-between">

        <h2 className="text-sm uppercase tracking-widest text-zinc-500">
          Recent Sessions
        </h2>

        <span className="text-xs text-zinc-600">
          {sessions.length} total
        </span>

      </div>

      <div className="mt-6 space-y-4">

        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No sessions recorded yet.
          </p>
        ) : (
          sessions.slice(0, 5).map((session) => {
            if (!session?.id) return null;

            return (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block rounded-xl border border-white/5 bg-black/30 p-4 transition hover:border-red-500/40 hover:bg-black/40"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    {session.driver_name && (
                      <div className="mb-2 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-red-300">
                        {session.driver_name}
                      </div>
                    )}

                    <p className="font-semibold text-white">
                      {session.event_name}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {session.track_name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {session.session_date}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Vehicle
                    </p>

                    <p className="text-sm text-white">
                      {session.vehicle}
                    </p>

                  </div>

                </div>

                {/* LAP TIMES */}
                <div className="mt-4 flex flex-wrap gap-2">

                  {session.lap_times?.map(
                    (
                      lap: string,
                      index: number
                    ) => (
                      <span
                        key={index}
                        className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 font-mono text-xs text-red-300"
                      >
                        {lap}
                      </span>
                    )
                  )}

                </div>

                {/* NOTES */}
                {session.notes && (
                  <p className="mt-4 text-sm text-zinc-400">
                    {session.notes}
                  </p>
                )}

              </Link>
            );
          })
        )}

      </div>

    </div>
  );
}
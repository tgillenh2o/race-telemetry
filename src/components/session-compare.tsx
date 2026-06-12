"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Legend,
} from "recharts";

type Session = {
  id: string;
  event_name: string;
  track_name: string;
  lap_times: string[];
};

type Props = {
  sessionA: Session;
  allSessions: Session[];
};

export function SessionCompare({ sessionA, allSessions }: Props) {
  const [selectedId, setSelectedId] = useState("");

  const sessionB = allSessions.find((s) => s.id === selectedId);

  // ---------------- LAP PARSER ----------------
  function parseLap(lap: string) {
    if (!lap?.includes(":")) return null;

    const [m, s] = lap.split(":").map(Number);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;

    return m * 60 + s;
  }

  // ---------------- CHART DATA ----------------
 const chartData = useMemo(() => {
  if (!sessionB) return [];

  const lapsA =
    sessionA.lap_times
      ?.map(parseLap)
      .filter((v): v is number => v !== null) ?? [];

  const lapsB =
    sessionB.lap_times
      ?.map(parseLap)
      .filter((v): v is number => v !== null) ?? [];

  const maxLaps = Math.max(
    lapsA.length,
    lapsB.length
  );

  return Array.from({ length: maxLaps }).map(
    (_, i) => ({
      lap: i + 1,
      sessionA: lapsA[i] ?? null,
      sessionB: lapsB[i] ?? null,
    })
  );
}, [sessionA, sessionB]);

  // ---------------- AVERAGES ----------------
  const avgA = useMemo(() => {
    const values = chartData.map((d) => d.sessionA).filter((v): v is number => v !== null);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [chartData]);

  const avgB = useMemo(() => {
    const values = chartData.map((d) => d.sessionB).filter((v): v is number => v !== null);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [chartData]);

  const delta = avgA !== null && avgB !== null ? avgA - avgB : null;

  // ---------------- FORMAT ----------------
  function formatLap(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // ---------------- BEST LAP INDEX (OPTIONAL) ----------------
 

 

  // ---------------- UI ----------------
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/30 p-4 md:p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Session Comparison
          </p>
          <h2 className="mt-1 text-lg font-semibold">Delta Analysis</h2>
        </div>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
        >
          <option value="">Select Session</option>

          {allSessions
            .filter((s) => s.id !== sessionA.id)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.event_name} — {s.track_name}
              </option>
            ))}
        </select>
      </div>

      {!sessionB ? (
        <div className="mt-6 text-sm text-zinc-500">
          Select a session to compare.
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                Session A Avg
              </p>
              <p className="mt-2 font-mono text-xl text-red-400">
                {avgA !== null ? formatLap(avgA) : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                Session B Avg
              </p>
              <p className="mt-2 font-mono text-xl text-white">
                {avgB !== null ? formatLap(avgB) : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                Delta
              </p>
              <p
                className={`mt-2 font-mono text-xl ${
                  delta !== null && delta > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {delta !== null ? `${delta > 0 ? "+" : "-"}${formatLap(Math.abs(delta))}` : "—"}
              </p>
            </div>
          </div>

     

          {/* CHART */}
          <div className="mt-8 rounded-2xl border border-white/5 bg-black/20 p-4">

            <div style={{ width: "100%", height: 360 }}>

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />

<XAxis
  dataKey="lap"
  stroke="#71717a"
  axisLine={false}
  tickLine={false}
/>              <YAxis
                    stroke="#71717a"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatLap}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "rgba(255,255,255,0.2)",
                      strokeWidth: 1,
                    }}
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                    }}
                   formatter={(value, name) => {
  const safeValue = typeof value === "number" ? value : Number(value);

  const safeName = typeof name === "string" ? name : "";

  if (Number.isNaN(safeValue)) return ["", ""];

  return [formatLap(safeValue), safeName];
}}
                    labelFormatter={(label) => `Lap ${label}`}
                  />

                  <Legend />

                  {avgA !== null && (
                    <ReferenceLine
                      y={avgA}
                      stroke="rgba(239,68,68,0.35)"
                      strokeDasharray="4 4"
                    />
                  )}

                  {avgB !== null && (
                    <ReferenceLine
                      y={avgB}
                      stroke="rgba(255,255,255,0.25)"
                      strokeDasharray="4 4"
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="sessionA"
                    name="Session A"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: "#ef4444",
                      strokeWidth: 2,
                      fill: "#ffffff",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="sessionB"
                    name="Session B"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                      fill: "#000000",
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </>
      )}

    </div>
  );
}

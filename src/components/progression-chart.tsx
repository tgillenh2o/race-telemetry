"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: {
    session: string;
    lap: number;
  }[];
};

function formatLap(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ProgressionChart({
  data,
}: Props) {
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">

      <h2 className="text-sm uppercase tracking-widest text-zinc-500">
        Progression Trend
      </h2>

      <div className="mt-6 h-[320px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
            />

            <XAxis
              dataKey="session"
              stroke="#71717a"
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="#71717a"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatLap}
            />

            <Tooltip
              contentStyle={{
                background: "#09090b",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
              }}
              formatter={(value: any) =>
                formatLap(value)
              }
            />

            <Line
              type="monotone"
              dataKey="lap"
              stroke="#ef4444"
              strokeWidth={3}
              dot={false}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}
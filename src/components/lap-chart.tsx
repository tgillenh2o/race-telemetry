"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  data: {
    lap: number;
    time: number;
  }[];
};

export function LapChart({ data }: Props) {
  if (!data?.length) return null;

  const bestLap = Math.min(...data.map((d) => d.time));

  function formatLapTime(value: number) {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatDelta(value: number) {
    const sign = value > 0 ? "+" : "";
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${sign}${m}:${String(s).padStart(2, "0")}`;
  }

  const chartData = data.map((d) => {
    const delta = d.time - bestLap;

    return {
      lap: d.lap,
      time: d.time,
      ghost: bestLap,
      delta,
    };
  });

  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;

    const isBest = payload.time === bestLap;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={isBest ? 7 : 4}
        fill={isBest ? "#ef4444" : "#ffffff"}
        stroke={isBest ? "#ffffff" : "none"}
        strokeWidth={isBest ? 2 : 0}
        style={{
          filter: isBest
            ? "drop-shadow(0 0 10px rgba(239,68,68,0.9))"
            : "none",
        }}
      />
    );
  };

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">

        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
          />

          <XAxis
            dataKey="lap"
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tickFormatter={formatLapTime}
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "delta") return formatDelta(value);
              return formatLapTime(value);
            }}
          />

          {/* 🟥 CURRENT LAP */}
          <Line
            type="monotone"
            dataKey="time"
            stroke="#ef4444"
            strokeWidth={3}
            dot={renderDot}
          />

          {/* ⚪ GHOST LAP */}
          <Line
            type="monotone"
            dataKey="ghost"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2}
            strokeDasharray="6 6"
            dot={false}
          />

          {/* 📊 DELTA LINE */}
          <Line
            type="monotone"
            dataKey="delta"
            stroke="rgba(59,130,246,0.8)"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>
    </div>
  );
}
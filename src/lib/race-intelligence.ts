export function getSessionMetrics(session: any) {
  const laps = (session.lap_times ?? [])
    .map(Number)
    .filter((n) => !Number.isNaN(n));

  const best = Math.min(...laps);
  const avg = laps.reduce((a, b) => a + b, 0) / (laps.length || 1);

  return {
    bestLap: best || null,
    avgLap: avg || null,
    totalLaps: laps.length,
    consistency:
      laps.length > 1
        ? Math.max(...laps) - Math.min(...laps)
        : 0,
  };
}

export function formatLapTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

export function calculateIdealLap(laps: number[]) {
  if (!laps.length) return null;

  // 5 laps per moto
  const moto1 = laps.slice(0, 5);
  const moto2 = laps.slice(5, 10);

  const bestMoto1 =
    moto1.length ? Math.min(...moto1) : null;

  const bestMoto2 =
    moto2.length ? Math.min(...moto2) : null;

  if (bestMoto1 !== null && bestMoto2 !== null) {
    return Math.min(bestMoto1, bestMoto2);
  }

  return bestMoto1 ?? bestMoto2;
}
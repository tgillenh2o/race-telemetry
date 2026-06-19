"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Session } from "@/types/session";

function formatLap(sec: number) {
  if (sec === null || sec === undefined || Number.isNaN(sec)) return "—";

  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseLap(lap: string | number): number | null {
  if (typeof lap === "number") {
    return Number.isFinite(lap) ? lap : null;
  }

  if (!lap) return null;

  const str = String(lap);

  if (str.includes(":")) {
    const [m, s] = str.split(":").map(Number);

    if (!Number.isFinite(m) || !Number.isFinite(s)) return null;

    return m * 60 + s;
  }

  const v = Number(str);

  return Number.isFinite(v) ? v : null;
}



export function AddSessionTrigger({
  session,
}: {
  session?: Session;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const editing = !!session;

   async function updateLaps(newLaps: number[]) {
  if (!session?.id) return;

  const { error } = await supabase
    .from("sessions")
    .update({ lap_times: newLaps })
    .eq("id", session.id);

  if (error) {
    console.error("Failed to update laps:", error);
    alert("Failed to delete lap: " + error.message);
    return;
  }

  router.refresh();
}

  // ✅ FIXED STATE (this was missing / broken)
  const [laps, setLaps] = useState<number[]>([]);
  const [newLap, setNewLap] = useState("");

  // ✅ Load existing laps correctly every time modal opens
  useEffect(() => {
    if (!open) return;

    const raw = session?.lap_times ?? [];

    const parsed = (Array.isArray(raw) ? raw : [])
      .map(parseLap)
      .filter((v): v is number => v !== null);

    setLaps(parsed);
  }, [open, session?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const payload = {
        user_id: user.id,
        event_name: String(form.get("event_name") || ""),
        track_name: String(form.get("track_name") || ""),
        vehicle: String(form.get("vehicle") || ""),
        driver_name: String(form.get("driver_name") || ""),
        driver_notes: String(form.get("driver_notes") || ""),
        tire_pressure: String(form.get("tire_pressure") || ""),
        shock_setup: String(form.get("shock_setup") || ""),
        weather: String(form.get("weather") || ""),

        // ✅ single source of truth
        lap_times: laps,
      };

      let res;

      if (editing && session?.id) {
        res = await supabase
          .from("sessions")
          .update(payload)
          .eq("id", session.id)
          .select();
      } else {
        res = await supabase.from("sessions").insert([payload]).select();
      }

      const { error } = res;

      if (error) {
        alert(error.message);
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
    

  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-xl"
      >
        {editing ? "Edit Session" : "Add Session"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">

            <div className="flex justify-between">
              <h2 className="text-xl font-bold">
                {editing ? "Edit Session" : "New Session"}
              </h2>

              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              <input name="event_name" defaultValue={session?.event_name ?? ""} className="w-full p-2 bg-black rounded" placeholder="Event" />
              <input name="track_name" defaultValue={session?.track_name ?? ""} className="w-full p-2 bg-black rounded" placeholder="Track" />
              <input name="vehicle" defaultValue={session?.vehicle ?? ""} className="w-full p-2 bg-black rounded" placeholder="Vehicle" />
              <input name="driver_name" defaultValue={session?.driver_name ?? ""} className="w-full p-2 bg-black rounded" placeholder="Driver" />

              {/* LAP EDITOR */}
              <div>
                <div className="flex gap-2">
                  <input
                    value={newLap}
                    onChange={(e) => setNewLap(e.target.value)}
                    placeholder="Lap time (e.g. 58.32)"
                    className="flex-1 p-2 bg-black rounded"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const val = parseLap(newLap as any);
                      if (val !== null) {
                        setLaps((prev) => [...prev, val]);
                        setNewLap("");
                      }
                    }}
                    className="px-3 bg-red-500 rounded"
                  >
                    Add
                  </button>
                </div>

                {/* DISPLAY (matches everywhere else) */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {laps.length === 0 && (
                    <p className="text-zinc-500 text-sm">
                      No lap times
                    </p>
                  )}

                  {laps.map((lap, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded"
                    >
                      <span className="font-mono">
                        {formatLap(lap)}
                      </span>

                    <button
  type="button"
  onClick={async () => {
    const updated = laps.filter((_, idx) => idx !== i);
    setLaps(updated);

    await updateLaps(updated);
  }}
  className="text-red-400"
>
  ✕
</button>
                    </div>
                  ))}
                </div>
              </div>

              <input name="tire_pressure" defaultValue={session?.tire_pressure ?? ""} className="w-full p-2 bg-black rounded" placeholder="Tire Pressure" />
              <input name="shock_setup" defaultValue={session?.shock_setup ?? ""} className="w-full p-2 bg-black rounded" placeholder="Shock Setup" />
              <input name="weather" defaultValue={session?.weather ?? ""} className="w-full p-2 bg-black rounded" placeholder="Weather" />

              <textarea name="driver_notes" defaultValue={session?.driver_notes ?? ""} className="w-full p-2 bg-black rounded min-h-[100px]" placeholder="Notes" />

              <button
                disabled={loading}
                className="w-full bg-red-500 py-2 rounded text-white"
              >
                {loading ? "Saving..." : "Save Session"}
              </button>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

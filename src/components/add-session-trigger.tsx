"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Session } from "@/types/session";

export function AddSessionTrigger({
  session,
}: {
  session?: Session;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const editing = !!session;

  // ---------------- LAPS STATE ----------------
  const [laps, setLaps] = useState<number[]>([]);
  const [newLap, setNewLap] = useState("");

  // ✅ ONLY ONE CLEAN LOAD
  useEffect(() => {
  const raw = session?.lap_times;

  if (!raw) {
    setLaps([]);
    return;
  }

  let parsed: number[] = [];

  // 🟢 CASE 1: already array
  if (Array.isArray(raw)) {
    parsed = (raw as (string | number)[])
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
  }

  // 🟡 CASE 2: Postgres string "{1,2,3}"
  else if (typeof raw === "string") {
    parsed = raw
      .replace(/[{}]/g, "")
      .split(",")
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
  }

  setLaps(parsed);
}, [session?.id]);
  // ---------------- SUBMIT ----------------
  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
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

        // ✅ SOURCE OF TRUTH
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
        res = await supabase
          .from("sessions")
          .insert([payload])
          .select();
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

  // ---------------- UI ----------------
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

              <input name="event_name" defaultValue={session?.event_name ?? ""} placeholder="Event" className="w-full p-2 bg-black rounded" />
              <input name="track_name" defaultValue={session?.track_name ?? ""} placeholder="Track" className="w-full p-2 bg-black rounded" />
              <input name="vehicle" defaultValue={session?.vehicle ?? ""} placeholder="Vehicle" className="w-full p-2 bg-black rounded" />
              <input name="driver_name" defaultValue={session?.driver_name ?? ""} placeholder="Driver" className="w-full p-2 bg-black rounded" />

              {/* ---------------- LAP EDITOR ---------------- */}
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
                      const val = Number(newLap);
                      if (Number.isFinite(val)) {
                        setLaps((prev) => [...prev, val]);
                        setNewLap("");
                      }
                    }}
                    className="px-3 bg-red-500 rounded"
                  >
                    Add
                  </button>
                </div>

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
                        {lap.toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setLaps((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <input name="tire_pressure" defaultValue={session?.tire_pressure ?? ""} placeholder="Tire Pressure" className="w-full p-2 bg-black rounded" />
              <input name="shock_setup" defaultValue={session?.shock_setup ?? ""} placeholder="Shock Setup" className="w-full p-2 bg-black rounded" />
              <input name="weather" defaultValue={session?.weather ?? ""} placeholder="Weather" className="w-full p-2 bg-black rounded" />

              <textarea name="driver_notes" defaultValue={session?.driver_notes ?? ""} placeholder="Notes" className="w-full p-2 bg-black rounded min-h-[100px]" />

              <button
                disabled={loading}
                className="w-full bg-red-500 py-2 rounded"
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

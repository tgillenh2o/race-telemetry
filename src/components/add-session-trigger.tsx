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

  // ---------------- LAP STATE (REAL FIX) ----------------
  const [laps, setLaps] = useState<number[]>([]);
  const [newLap, setNewLap] = useState("");

 useEffect(() => {
  if (!session?.lap_times) return;

  setLaps(
    session.lap_times
      .map((l) => Number(l))
      .filter((n) => !isNaN(n))
  );
}, [session?.id]); // 🔥 IMPORTANT: only run once per session

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

        // 🔥 REAL SOURCE OF TRUTH
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
        console.error(error);
        alert(error.message);
        return;
      }

      console.log("Saved session");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  // ---------------- UI ----------------
  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-xl"
      >
        {editing ? "Edit Session" : "Add Session"}
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-3">

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editing ? "Edit Session" : "New Session"}
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                name="event_name"
                defaultValue={session?.event_name ?? ""}
                placeholder="Event"
                className="w-full p-2 rounded bg-black text-white"
              />

              <input
                name="track_name"
                defaultValue={session?.track_name ?? ""}
                placeholder="Track"
                className="w-full p-2 rounded bg-black text-white"
              />

              <input
                name="vehicle"
                defaultValue={session?.vehicle ?? ""}
                placeholder="Vehicle"
                className="w-full p-2 rounded bg-black text-white"
              />

              <input
                name="driver_name"
                defaultValue={session?.driver_name ?? ""}
                placeholder="Driver Name"
                className="w-full p-2 rounded bg-black text-white"
              />

              {/* ---------------- LAP EDITOR ---------------- */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={newLap}
                    onChange={(e) => setNewLap(e.target.value)}
                    placeholder="Add lap (e.g. 58.32)"
                    className="flex-1 p-2 rounded bg-black text-white"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const val = Number(newLap);
                      if (!isNaN(val)) {
                        setLaps([...laps, val]);
                        setNewLap("");
                      }
                    }}
                    className="px-3 py-2 bg-red-500 rounded text-white"
                  >
                    Add
                  </button>
                </div>

             <div className="flex flex-wrap gap-2">
  {laps.length === 0 && (
    <p className="text-zinc-500 text-sm">
      No lap times added
    </p>
  )}

  {laps.map((lap, index) => (
    <div
      key={index}
      className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded"
    >
      <span className="font-mono">
        {lap.toFixed(2)}
      </span>

      {/* DELETE BUTTON */}
      <button
        type="button"
        onClick={() => {
          setLaps((prev) =>
            prev.filter((_, i) => i !== index)
          );
        }}
        className="text-red-400 hover:text-red-300"
      >
        ✕
      </button>
    </div>
  ))}
</div>
              </div>

              {/* LAP LIST */}
<div className="flex flex-wrap gap-2 mt-2">
  {laps.length === 0 && (
    <p className="text-zinc-500 text-sm">
      No lap times added
    </p>
  )}

  {laps.map((lap, index) => (
    <div
      key={index}
      className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded"
    >
      <span className="font-mono">
        {Number(lap).toFixed(2)}
      </span>

      <button
        type="button"
        onClick={() => {
          setLaps((prev) =>
            prev.filter((_, i) => i !== index)
          );
        }}
        className="text-red-400 hover:text-red-300"
      >
        ✕
      </button>
    </div>
  ))}
</div>

              <input
                name="tire_pressure"
                defaultValue={session?.tire_pressure ?? ""}
                placeholder="Tire Pressure"
                className="w-full p-2 rounded bg-black text-white"
              />

              <input
                name="shock_setup"
                defaultValue={session?.shock_setup ?? ""}
                placeholder="Shock Setup"
                className="w-full p-2 rounded bg-black text-white"
              />

              <input
                name="weather"
                defaultValue={session?.weather ?? ""}
                placeholder="Weather"
                className="w-full p-2 rounded bg-black text-white"
              />

              <textarea
                name="driver_notes"
                defaultValue={session?.driver_notes ?? ""}
                placeholder="Driver Notes"
                className="w-full p-2 rounded bg-black text-white min-h-[100px]"
              />

              <button
                disabled={loading}
                className="w-full bg-red-500 py-2 rounded text-white"
              >
                {loading
                  ? "Saving..."
                  : editing
                  ? "Save Changes"
                  : "Save Session"}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}

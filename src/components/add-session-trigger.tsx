"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AddSessionTrigger() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const form = new FormData(e.currentTarget);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      event_name: form.get("event_name") || "",
      track_name: form.get("track_name") || "",
      vehicle: form.get("vehicle") || "",
      tire_pressure: form.get("tire_pressure") || "",
      shock_setup: form.get("shock_setup") || "",
      weather: form.get("weather") || "",
      lap_times: String(form.get("lap_times") || "")
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    };

    const { error } = await supabase
      .from("sessions")
      .insert([payload]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-400"
      >
        Add Session
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                New Session
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-3"
            >
              <input
                name="event_name"
                placeholder="Event"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <input
                name="track_name"
                placeholder="Track"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <input
                name="vehicle"
                placeholder="Vehicle"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <input
                name="tire_pressure"
                placeholder="Tire Pressure"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <input
                name="shock_setup"
                placeholder="Shock Setup"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <input
                name="weather"
                placeholder="Weather"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <textarea
                name="lap_times"
                placeholder="Lap Times (comma separated)"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white min-h-[120px]"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-xl bg-red-500 py-3 font-semibold hover:bg-red-400 disabled:opacity-50"
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

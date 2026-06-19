"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

import type { Session } from "@/types/session";
import type { PostgrestError } from "@supabase/supabase-js";

export function AddSessionTrigger({
  session,
}: {
  session?: Session;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const editing = !!session;

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
      console.error("No user");
      setLoading(false);
      return;
    }

     const lapArray = String(form.get("lap_times") || "")
  .split(",")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => Number(l))
  .filter((n) => !isNaN(n));

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

  lap_times: lapArray,
};

    let data;
    let error: PostgrestError | null = null;

    try {
      if (editing && session?.id) {
        const res = await supabase
          .from("sessions")
          .update({
            ...payload,
            lap_times: payload.lap_times.map((l) => l.trim()),
          })
          .eq("id", session.id)
          .select();

        data = res.data;
        error = res.error;
      } else {
        const res = await supabase
          .from("sessions")
          .insert([payload])
          .select();

        data = res.data;
        error = res.error;
      }

      if (error) {
        console.error(error);
        alert(error?.message ?? "Unknown error");
        return;
      }

      console.log("Saved session:", data);
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

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

              <input
                name="lap_times"
                type="text"
                defaultValue={session?.lap_times?.join(", ") ?? ""}
                placeholder="Laptimes: 58.32, 58.10, 57.94"
                className="w-full p-2 rounded bg-black text-white"
              />

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

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Session } from "@/types/session";

export function AddSessionTrigger({
  session,
}: {
  session?: Session;
}) {


  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  const editing = !!session;
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    const payload = {
      user_id: user.id,

      event_name: form.get("event_name") || "",
      track_name: form.get("track_name") || "",
      vehicle: form.get("vehicle") || "",

      driver_name: form.get("driver_name") || "",
      driver_notes: form.get("driver_notes") || "",

      tire_pressure: form.get("tire_pressure") || "",
      shock_setup: form.get("shock_setup") || "",
      weather: form.get("weather") || "",

      lap_times:
  String(form.get("lap_times") ?? "")
    .split(",")
    .map((lap) => lap.trim())
    .filter(Boolean),
    };

    let error;

if (editing) {
  ({ error } = await supabase
    .from("sessions")
    .update(payload)
    .eq("id", session!.id));
} else {
  ({ error } = await supabase
    .from("sessions")
    .insert([payload]));
}

    if (error) {
      console.error("Insert error:", error);
    }

    setLoading(false);
    setOpen(false);

    // refresh page data
    window.location.reload();
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

              <input name="event_name" defaultValue={session?.event_name ?? ""} placeholder="Event" className="w-full p-2 rounded bg-black text-white" />
              <input name="track_name" defaultValue={session?.track_name ?? ""} placeholder="Track" className="w-full p-2 rounded bg-black text-white" />
              <input name="vehicle" defaultValue={session?.vehicle ?? ""} placeholder="Vehicle" className="w-full p-2 rounded bg-black text-white" />

              <input name="driver_name" defaultValue={session?.driver_name ?? ""} placeholder="Driver Name" className="w-full p-2 rounded bg-black text-white" />
              <input name="lap_times" type="text" defaultValue={session?.lap_times?.join(", ") ?? ""} placeholder=" Laptimes 58.32, 58.10, 57.94, 58.27" className="w-full p-2 rounded bg-black text-white"/>

              <input name="tire_pressure" defaultValue={session?.tire_pressure ?? ""} placeholder="Tire Pressure" className="w-full p-2 rounded bg-black text-white" />
              <input name="shock_setup" defaultValue={session?.shock_setup ?? ""} placeholder="Shock Setup" className="w-full p-2 rounded bg-black text-white" />
              <input name="weather" defaultValue={session?.weather ?? ""} placeholder="Weather" className="w-full p-2 rounded bg-black text-white" />

              <textarea
  name="notes"
  defaultValue={session?.notes ?? ""}
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

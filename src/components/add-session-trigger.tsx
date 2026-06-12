"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AddSessionTrigger() {
  const [loading, setLoading] = useState(false);

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

      lap_times: [],
    };

    const { error } = await supabase.from("sessions").insert([payload]);

    if (error) {
      console.error("Insert error:", error);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="event_name" placeholder="Event" className="text-black" />
      <input name="track_name" placeholder="Track" className="text-black" />
      <input name="vehicle" placeholder="Vehicle" className="text-black" />

      <input name="driver_name" placeholder="Driver Name" className="text-black" />

      <input name="tire_pressure" placeholder="Tire Pressure" className="text-black" />
      <input name="shock_setup" placeholder="Shock Setup" className="text-black" />
      <input name="weather" placeholder="Weather" className="text-black" />

      <textarea
        name="driver_notes"
        placeholder="Driver Notes"
        className="text-black"
      />

      <button disabled={loading} className="bg-red-500 px-4 py-2 text-white">
        {loading ? "Saving..." : "Add Session"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AddSessionTrigger() {
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const form = new FormData(
      e.currentTarget
    );

    // ✅ GET CURRENT USER
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("No user found");
      setLoading(false);
      return;
    }

    // ✅ BUILD PAYLOAD
    const payload = {
      user_id: user.id,

      event_name:
        form.get("event_name") || "",

      track_name:
        form.get("track_name") || "",

      vehicle:
        form.get("vehicle") || "",

      tire_pressure:
        form.get("tire_pressure") || "",

      shock_setup:
        form.get("shock_setup") || "",

      weather:
        form.get("weather") || "",

      lap_times: String(
        form.get("lap_times") || ""
      )
        .split(",")
        .map((lap) => lap.trim())
        .filter(Boolean),
    };

    // ✅ INSERT SESSION
    const { error } = await supabase
      .from("sessions")
      .insert([payload]);

    if (error) {
      console.error(
        "Session insert error:",
        error
      );

      alert(error.message);

      setLoading(false);
      return;
    }

    // ✅ REFRESH PAGE
    window.location.reload();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-2"
    >
      <input
        name="event_name"
        placeholder="Event"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <input
        name="track_name"
        placeholder="Track"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <input
        name="vehicle"
        placeholder="Vehicle"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <input
        name="tire_pressure"
        placeholder="Tire Pressure"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <input
        name="shock_setup"
        placeholder="Shock Setup"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <input
        name="weather"
        placeholder="Weather"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <input
        name="lap_times"
        placeholder="Lap Times (comma separated)"
        className="rounded border border-white/10 bg-black px-3 py-2 text-white"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-400 disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Add Session"}
      </button>
    </form>
  );
}

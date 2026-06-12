"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AddSessionTrigger() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);

    // ✅ GET USER INSIDE FUNCTION (SAFE)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("No user logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("sessions").insert([
      {
        user_id: user.id,

        event_name: form.get("event_name") || "",
        track_name: form.get("track_name") || "",
        vehicle: form.get("vehicle") || "",
        driver_name: form.get("driver_name") || "",
        driver_notes: form.get("driver_notes") || "",

        lap_times: [],
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input name="event_name" placeholder="Event" className="text-black" />
      <input name="track_name" placeholder="Track" className="text-black" />
      <input name="driver_name" placeholder="Driver" className="text-black" />

      <button
        disabled={loading}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        {loading ? "Saving..." : "Add Session"}
      </button>
    </form>
  );
}

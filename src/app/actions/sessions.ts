"use server";

import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function createSession(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  await supabase.from("sessions").insert({
    event_name: formData.get("event_name"),
    track_name: formData.get("track_name"),
    lap_times: JSON.parse(formData.get("lap_times") as string),
    vehicle: formData.get("vehicle"),
    tire_pressure: formData.get("tire_pressure"),
    shock_setup: formData.get("shock_setup"),
    weather: formData.get("weather"),
    user_id: user.id,
  });
}
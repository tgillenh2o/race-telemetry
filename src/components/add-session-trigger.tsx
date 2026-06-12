const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) return;

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
  console.error("INSERT ERROR:", error);
}

"use client";

import { createSession } from "@/app/actions/sessions";

export function AddSessionTrigger() {
  async function handleSubmit(formData: FormData) {
    await createSession(formData);
  }

  return (
    <form action={handleSubmit}>
      <button className="px-4 py-2 bg-red-500 text-white rounded">
        Add Session
      </button>
    </form>
  );
}


import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AddSessionTrigger() {
  const [open, setOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) throw new Error("Not logged in");

await supabase.from("sessions").insert({
  event_name,
  track_name,
  lap_times,
  vehicle,
  tire_pressure,
  shock_setup,
  weather,
  user_id: user.id, // 🔥 CRITICAL LINE
});

  const [eventName, setEventName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [lapTimes, setLapTimes] = useState("");
const [tirePsi, setTirePsi] = useState("");
const [shockSetup, setShockSetup] = useState("");
const [carSetupChanges, setCarSetupChanges] = useState("");
const [weatherConditions, setWeatherConditions] = useState("");
const [driverNotes, setDriverNotes] = useState("");
const [motoNumber, setMotoNumber] = useState("1");
const [driverName, setDriverName] = useState("");

  const [loading, setLoading] = useState(false);

  async function saveSession() {
    try {
      setLoading(true);

      const parsedLaps = lapTimes
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("sessions")
       .insert({
  event_name: eventName,
  track_name: trackName,
  driver_name: driverName,
  vehicle,
  lap_times: parsedLaps,
  tire_pressure: tirePsi,
  shock_setup: shockSetup,
  setup_changes: carSetupChanges,
  weather: weatherConditions,
  driver_notes: driverNotes,
  moto_number: Number(motoNumber),
});

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold tracking-widest text-red-400 hover:bg-red-500/20 transition"
      >
        + NEW SESSION
      </button>

     {/* MODAL */}
{mounted &&
  open &&
  createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />

      {/* PANEL */}
   <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-red-500/20 bg-zinc-950 p-8 shadow-[0_0_80px_rgba(239,68,68,0.18)]">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-white">
              New Session
            </h2>

            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-red-400">
              Pit Lane Entry
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-white text-xl"
          >
            ✕
          </button>

        </div>

        {/* FORM */}
       <div className="mt-8 space-y-5 pr-2">

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
              Event Name
            </label>

            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
              placeholder="Outlaw Series Round 1"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
              Track Name
            </label>

            <input
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
              placeholder="Eagles Canyon"
            />
          </div>

         <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
              Driver
            </label>

            <input
  value={driverName}
  onChange={(e) =>
    setDriverName(e.target.value)
  }
  placeholder="Driver Name"
  className="rounded-lg border border-white/10 bg-black px-4 py-3"
/>
</div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
              Vehicle
            </label>

            <input
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
              placeholder="Polaris RS1"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
              Lap Times
            </label>

            <input
              value={lapTimes}
              onChange={(e) => setLapTimes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
              placeholder="1:27, 1:26, 1:28"
            />

            <p className="mt-2 text-xs text-zinc-600">
              Separate laps with commas
            </p>
          </div>
          
	  <div>
  <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
    Tire PSI
  </label>

  <input
    value={tirePsi}
    onChange={(e) => setTirePsi(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
    placeholder="12 PSI Front / 10 PSI Rear"
  />
</div>

<div>
  <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
    Shock Setup
  </label>

  <input
    value={shockSetup}
    onChange={(e) => setShockSetup(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
    placeholder="Compression 4 / Rebound 6"
  />
</div>

<div>
  <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
    Car Setup Changes
  </label>

  <textarea
    value={carSetupChanges}
    onChange={(e) => setCarSetupChanges(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40 min-h-[100px]"
    placeholder="Adjusted ride height and front sway bar..."
  />
</div>

<div>
  <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
    Weather Conditions
  </label>

  <input
    value={weatherConditions}
    onChange={(e) => setWeatherConditions(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40"
    placeholder="Dry, dusty, 84°F"
  />
</div>

<div>
  <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">
    Driver Notes
  </label>

  <textarea
    value={driverNotes}
    onChange={(e) => setDriverNotes(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500/40 min-h-[120px]"
    placeholder="Loose entering corners but stable on exit..."
  />
</div>
     <div>
  <label className="text-sm text-zinc-400">
    Moto Number
  </label>

  <select
    value={motoNumber}
    onChange={(e) =>
      setMotoNumber(e.target.value)
    }
    className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-white"
  >
    <option value="1">Moto 1</option>
    <option value="2">Moto 2</option>
  </select>
</div>

        </div>

        {/* FOOTER */}
        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={saveSession}
            disabled={loading}
            className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Session"}
          </button>

        </div>

      </div>

    </div>,
    document.body
  )}
    </>
  );
}
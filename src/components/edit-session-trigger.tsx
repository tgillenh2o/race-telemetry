"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  session: any;
};

export function EditSessionTrigger({
  session,
}: Props) {
  const [open, setOpen] = useState(false);

  const [driverName, setDriverName] =
  useState(session.driver_name || "");


  const [eventName, setEventName] =
    useState(session.event_name || "");

  const [trackName, setTrackName] =
    useState(session.track_name || "");

  const [vehicle, setVehicle] =
    useState(session.vehicle || "");

  const [weather, setWeather] =
    useState(session.weather || "");

  const [tirePressure, setTirePressure] =
    useState(session.tire_pressure || "");

  const [shockSetup, setShockSetup] =
    useState(session.shock_setup || "");

  const [lapTimes, setLapTimes] =
    useState(
      (session.lap_times || []).join(", ")
    );

  async function handleSave() {
    const parsedLaps = lapTimes
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("sessions")
      .update({
        driver_name: driverName,
        event_name: eventName,
        track_name: trackName,
        vehicle,
        weather,
        tire_pressure: tirePressure,
        shock_setup: shockSetup,
        lap_times: parsedLaps,
      })
      .eq("id", session.id);

    if (error) {
      console.error(error);
      return;
    }

    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm hover:border-red-500/30"
      >
        Edit Session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">

          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6">

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-semibold">
                Edit Session
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">


              <input
                value={driverName}
                onChange={(e) =>
                  setDriverName(e.target.value)
                }
                placeholder="Driver Name"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

              <input
                value={eventName}
                onChange={(e) =>
                  setEventName(e.target.value)
                }
                placeholder="Event Name"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

              <input
                value={trackName}
                onChange={(e) =>
                  setTrackName(e.target.value)
                }
                placeholder="Track Name"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

              <input
                value={vehicle}
                onChange={(e) =>
                  setVehicle(e.target.value)
                }
                placeholder="Vehicle"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

              <input
                value={weather}
                onChange={(e) =>
                  setWeather(e.target.value)
                }
                placeholder="Weather"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

              <input
                value={tirePressure}
                onChange={(e) =>
                  setTirePressure(e.target.value)
                }
                placeholder="Tire Pressure"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

              <input
                value={shockSetup}
                onChange={(e) =>
                  setShockSetup(e.target.value)
                }
                placeholder="Shock Setup"
                className="rounded-lg border border-white/10 bg-black px-4 py-3"
              />

            </div>

            <textarea
              value={lapTimes}
              onChange={(e) =>
                setLapTimes(e.target.value)
              }
              placeholder="Lap Times"
              className="mt-4 h-32 w-full rounded-lg border border-white/10 bg-black px-4 py-3"
            />

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-400"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}
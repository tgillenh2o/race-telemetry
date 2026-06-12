export type Session = {
  id: string;

  event_name: string;
  track_name: string;
  session_date: string;

  vehicle: string;

  notes: string | null;
  weather: string | null;

  tire_pressure: string | null;
  shock_setup: string | null;

  driver_name?: string | null;

  lap_times: string[] | null;
};
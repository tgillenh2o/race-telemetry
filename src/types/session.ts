export type Session = {
  id: string;

  event_name: string | null;
  track_name: string | null;
  session_date: string | null;

  vehicle: string | null;

  driver_notes: string | null;
  weather: string | null;

  tire_pressure: string | null;
  shock_setup: string | null;

  driver_name?: string | null;

  lap_times: string[] | null;
  
  created_at?: string;
};

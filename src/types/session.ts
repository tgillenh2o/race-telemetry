export interface Session {
  id: string;
  user_id: string;

  event_name: string;
  track_name: string;
  vehicle: string;

  driver_name: string;
  driver_notes: string;

  tire_pressure: string;
  shock_setup: string;
  weather: string;

  lap_times: number[];

  created_at: string;
}

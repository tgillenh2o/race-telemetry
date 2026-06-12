import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function Page() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <p className="text-zinc-400 mt-2">
        Sessions: {sessions?.length || 0}
      </p>

      <div className="mt-6 space-y-2">
        {sessions?.map((s) => (
          <a
            key={s.id}
            href={`/session/${s.id}`}
            className="block p-3 border border-white/10 rounded"
          >
            {s.event_name} — {s.track_name}
          </a>
        ))}
      </div>
    </div>
  );
}

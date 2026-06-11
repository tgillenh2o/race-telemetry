"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function DeleteSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this session permanently?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      alert("Failed to delete session");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
    >
      Delete Session
    </button>
  );
}
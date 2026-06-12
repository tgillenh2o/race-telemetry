"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-red-500/30 hover:text-red-400"
    >
      Logout
    </button>
  );
}
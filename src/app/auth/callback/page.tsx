"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      // Exchange auth code for session
      await supabase.auth.getSession();

      // Redirect after successful login
      router.push("/");
    }

    handleAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-8">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          Authenticating...
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          Signing you in
        </h1>
      </div>
    </div>
  );
}
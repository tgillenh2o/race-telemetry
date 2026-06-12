"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function load() {
      await supabase.auth.getSession();

      router.push("/");
    }

    load();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      Signing you in...
    </div>
  );
}
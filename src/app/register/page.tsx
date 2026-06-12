"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">

        <h1 className="text-xl font-bold">Create Account</h1>

        <input
          className="w-full rounded bg-black p-2"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full rounded bg-black p-2"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full rounded bg-red-500 p-2"
        >
          Sign Up
        </button>
<p className="mt-4 text-sm text-zinc-500">
  Already have an account?{" "}
  <Link href="/login" className="text-red-400 hover:underline">
    Sign in
  </Link>
</p>

      </div>
    </div>
  );
}
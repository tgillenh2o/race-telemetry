"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

  
const { error } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  });

if (error) {
  alert(error.message);
  return;
}

window.location.href = "/";



    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/40 p-8">

        <h1 className="text-3xl font-bold">
          Sign In
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Access your telemetry dashboard
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-6 space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-500 py-3 font-semibold transition hover:bg-red-400"
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-500">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-red-400 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

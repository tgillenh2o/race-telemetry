"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleRegister(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Check your email to confirm your account."
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/40 p-8">

        <h1 className="text-3xl font-bold">
          Create Account
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Start tracking race telemetry
        </p>

        <form
          onSubmit={handleRegister}
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

          {message && (
            <p className="text-sm text-green-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-500 py-3 font-semibold transition hover:bg-red-400"
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-red-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
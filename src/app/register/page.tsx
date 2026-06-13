"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleRegister(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    // CREATE ACCOUNT
    const { error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // AUTO LOGIN
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // WAIT FOR SESSION
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    // REDIRECT
    window.location.href = "/";
  }

  return (
    <div
      className="
      min-h-screen
      bg-black
      text-white
      flex
      items-center
      justify-center
      px-6
      bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.12),transparent_35%)]
    "
    >
      <div
        className="
        w-full
        max-w-md
        rounded-3xl
        border
        border-red-500/10
        bg-zinc-950/60
        backdrop-blur-xl
        p-8
        shadow-[0_0_45px_rgba(255,0,0,0.12)]
      "
      >
        <h1
          className="
          text-3xl
          font-black
          tracking-[0.2em]
        "
        >
          <span className="text-red-500">
            STAGE
          </span>
          <span className="text-zinc-300">
            {" "}
            / LINE
          </span>
        </h1>

        <p className="mt-3 text-zinc-500 text-sm">
          Create your telemetry account
        </p>

        <form
          onSubmit={handleRegister}
          className="mt-8 space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="
              w-full
              rounded-xl
              border
              border-white/10
              bg-black/40
              px-4
              py-3
              outline-none
              focus:border-red-500/40
            "
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="
              w-full
              rounded-xl
              border
              border-white/10
              bg-black/40
              px-4
              py-3
              outline-none
              focus:border-red-500/40
            "
          />

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-xl
              bg-red-500
              py-3
              font-semibold
              transition-all
              hover:bg-red-400
              hover:shadow-[0_0_25px_rgba(255,0,0,0.45)]
            "
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="
              text-red-400
              hover:text-red-300
            "
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

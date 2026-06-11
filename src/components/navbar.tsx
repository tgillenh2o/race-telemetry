import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* BRAND */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]" />

          <span className="text-sm font-semibold tracking-widest text-white">
            Stage<span className="text-red-500">Line</span>
          </span>
        </Link>

        {/* RIGHT SIDE (future controls) */}
        <div className="flex items-center gap-4">

          <div className="hidden text-xs uppercase tracking-widest text-zinc-500 sm:block">
            Telemetry Dashboard
          </div>

        </div>

      </div>
    </header>
  );
}
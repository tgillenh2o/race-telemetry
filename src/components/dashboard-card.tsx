import { ReactNode } from "react";

export function DashboardCard({
  title,
  children,
  className = "",
  icon,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-md transition hover:border-red-500/20 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500">
          {title}
        </h3>

        {icon && (
          <div className="text-red-400 opacity-80">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
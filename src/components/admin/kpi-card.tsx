import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type KpiTone = "blue" | "teal" | "green" | "violet" | "rose";

const TONE: Record<KpiTone, { bg: string; text: string }> = {
  blue: { bg: "bg-report-blue/10", text: "text-report-blue" },
  teal: { bg: "bg-report-teal/10", text: "text-report-teal" },
  green: { bg: "bg-report-green/10", text: "text-report-green" },
  violet: { bg: "bg-report-violet/10", text: "text-report-violet" },
  rose: { bg: "bg-report-rose/10", text: "text-report-rose" },
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  tone = "blue",
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Percent change vs the previous period. */
  delta?: number | null;
  tone?: KpiTone;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
}) {
  const t = TONE[tone];
  const up = (delta ?? 0) > 0;
  const flat = delta == null || Math.round(delta) === 0;
  const DeltaIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", t.bg)}>
            <Icon className={cn("size-4", t.text)} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              flat
                ? "bg-muted text-muted-foreground"
                : up
                  ? "bg-report-green/10 text-report-green"
                  : "bg-report-rose/10 text-report-rose",
            )}
          >
            <DeltaIcon className="size-3" />
            {flat ? "0%" : `${Math.abs(Math.round(delta ?? 0))}%`}
          </span>
        )}
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

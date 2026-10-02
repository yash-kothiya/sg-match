"use client";

import { cn } from "@/lib/utils";

export type ModeFilter = "all" | "online" | "in_person" | "hybrid";

const FILTERS: { value: ModeFilter; label: string }[] = [
  { value: "all", label: "All formats" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

/** Narrow the results by how the group meets. Shows how many groups each option has. */
export function ModeFilterBar({
  mode,
  onChange,
  counts,
}: {
  mode: ModeFilter;
  onChange: (mode: ModeFilter) => void;
  counts: Record<ModeFilter, number>;
}) {
  return (
    <div role="radiogroup" aria-label="Study format" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const active = mode === filter.value;
        const disabled = filter.value !== "all" && counts[filter.value] === 0;
        return (
          <button
            key={filter.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(filter.value)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50",
            )}
          >
            {filter.label}
            <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {counts[filter.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

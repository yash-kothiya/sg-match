"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/** Multi-select as toggleable chips. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  options: readonly Option<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  onBlur?: () => void;
  invalid?: boolean;
}) {
  const toggle = (item: T) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);

  return (
    <div role="group" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.value)}
            onBlur={onBlur}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:border-primary/50 hover:bg-accent",
              invalid && !selected && "border-destructive",
            )}
          >
            {selected && <CheckIcon className="size-4" aria-hidden />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

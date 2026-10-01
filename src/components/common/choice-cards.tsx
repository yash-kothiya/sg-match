"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; description?: string };

/** Single-select as a row of big radio cards. Native radios, so keyboard and screen readers just work. */
export function ChoiceCards<T extends string>({
  name,
  options,
  value,
  onChange,
  onBlur,
  invalid,
  className,
}: {
  name: string;
  options: readonly Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  onBlur?: () => void;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-invalid={invalid || undefined} className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            onBlur={onBlur}
            className="peer sr-only"
          />
          <div
            className={cn(
              "flex h-full flex-col gap-1 rounded-xl border bg-card p-4 transition-colors",
              "hover:border-primary/50 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              "peer-checked:border-primary peer-checked:bg-accent peer-checked:ring-1 peer-checked:ring-primary",
              invalid && "border-destructive",
            )}
          >
            <span className="text-sm font-semibold">{option.label}</span>
            {option.description && (
              <span className="text-xs text-muted-foreground">{option.description}</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

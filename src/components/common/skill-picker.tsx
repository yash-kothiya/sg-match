"use client";

import { CheckIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SkillOption } from "@/schemas/profile";

/** Searchable, category-grouped multi-select for the skill catalog. Handles loading, error and empty states. */
export function SkillPicker({
  skills,
  isLoading,
  errorMessage,
  value,
  onChange,
  onBlur,
  max,
}: {
  skills: SkillOption[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  max: number;
}) {
  const [query, setQuery] = useState("");
  const atLimit = value.length >= max;

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = (skills ?? []).filter(
      (skill) => !needle || skill.name.toLowerCase().includes(needle),
    );
    const byCategory = new Map<string, SkillOption[]>();
    for (const skill of visible) {
      const key = skill.category ?? "Other";
      byCategory.set(key, [...(byCategory.get(key) ?? []), skill]);
    }
    return [...byCategory.entries()];
  }, [skills, query]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading skills">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <p role="alert" className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        We couldn&apos;t load the skill list ({errorMessage}). You can skip this step and add skills
        later.
      </p>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No skills are available yet. You can skip this step and add skills later.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
          placeholder="Search skills"
          aria-label="Search skills"
          className="pl-9"
        />
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {value.length} of {max} selected
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skills match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="flex max-h-80 flex-col gap-5 overflow-y-auto pr-1">
          {groups.map(([category, items]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => {
                  const selected = value.includes(skill.id);
                  const disabled = !selected && atLimit;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      aria-pressed={selected}
                      disabled={disabled}
                      onClick={() => toggle(skill.id)}
                      onBlur={onBlur}
                      className={cn(
                        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none",
                        "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-card hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      {selected && <CheckIcon className="size-3.5" aria-hidden />}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

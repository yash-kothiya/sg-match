"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Free-form tags: type and press Enter or comma. Suggestions are one-click shortcuts. */
export function TagInput({
  id,
  value,
  onChange,
  onBlur,
  suggestions = [],
  max,
  placeholder,
  invalid,
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  suggestions?: readonly string[];
  max?: number;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const atLimit = max !== undefined && value.length >= max;
  const has = (tag: string) => value.some((v) => v.toLowerCase() === tag.toLowerCase());

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || has(tag) || atLimit) return;
    onChange([...value, tag]);
  };
  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));

  const openSuggestions = suggestions.filter((s) => !has(s));

  return (
    <div className="flex flex-col gap-3">
      <Input
        id={id}
        value={draft}
        disabled={atLimit}
        aria-invalid={invalid || undefined}
        placeholder={atLimit ? `You've added the maximum of ${max}` : placeholder}
        onChange={(event) => {
          const text = event.target.value;
          if (text.endsWith(",")) {
            add(text.slice(0, -1));
            setDraft("");
          } else {
            setDraft(text);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault(); // don't submit the wizard form
            add(draft);
            setDraft("");
          } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => {
          add(draft);
          setDraft("");
          onBlur?.();
        }}
      />

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Selected topics">
          {value.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="h-7 gap-1 pr-1 pl-3 text-sm">
                {tag}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${tag}`}
                  className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-foreground/10"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {openSuggestions.length > 0 && !atLimit && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Suggestions</span>
          <div className="flex flex-wrap gap-2">
            {openSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                className={cn(
                  "h-8 cursor-pointer rounded-full border border-dashed px-3 text-xs font-medium transition-colors",
                  "text-muted-foreground hover:border-primary hover:bg-accent hover:text-foreground",
                )}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

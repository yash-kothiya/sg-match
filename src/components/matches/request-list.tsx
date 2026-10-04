"use client";

import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { levelLabel, modeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { RequestSummary } from "@/schemas/matching";

const MAX_SKILLS_SHOWN = 3;

function Skills({ request, active }: { request: RequestSummary; active: boolean }) {
  const shown = request.skills.slice(0, MAX_SKILLS_SHOWN);
  const extra = request.skills.length - shown.length;
  if (shown.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((skill) => (
        <span
          key={skill}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            active ? "bg-card text-accent-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {skill}
        </span>
      ))}
      {extra > 0 && <span className="px-1 py-0.5 text-[11px] text-muted-foreground">+{extra}</span>}
    </span>
  );
}

function RequestItem({
  request,
  active,
  onSelect,
  onDelete,
}: {
  request: RequestSummary;
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-current={active ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "relative flex w-full cursor-pointer flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          onDelete && "pr-10",
          active ? "border-primary bg-accent" : "border-transparent hover:bg-muted/70",
        )}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm leading-snug font-semibold">{request.title}</span>
          {request.topScore !== null && (
            <span
              title="Best match score for this request"
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
              )}
            >
              {Math.round(request.topScore)}
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {request.kind === "sample" && request.ownerName ? `${request.ownerName} · ` : ""}
          {levelLabel(request.level)} · {modeLabel(request.mode)}
        </span>
        <Skills request={request} active={active} />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete request: ${request.title}`}
          className="absolute top-2.5 right-2.5 flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 "
        >
          <Trash2Icon className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Left panel on desktop: your profile, your requests, and a collapsed set of sample requests. */
export function RequestList({
  requests,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: {
  requests: RequestSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (request: RequestSummary) => void;
}) {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const mine = requests.filter((r) => r.kind === "mine");
  const samples = requests.filter((r) => r.kind === "sample");
  // Never hide the selected sample behind a collapsed section.
  const showSamples = samplesOpen || samples.some((r) => r.id === selectedId);

  return (
    <aside
      aria-label="Study requests"
      className="hidden flex-col overflow-hidden rounded-3xl border bg-card shadow-sm lg:flex lg:h-full lg:min-h-0"
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
        <h2 className="font-heading text-lg font-semibold">Study requests</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PlusIcon className="size-3.5" aria-hidden />
          New request
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="px-2 pt-1 pb-2 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">My requests</h3>

        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            You haven&apos;t made a request yet. Create one and we&apos;ll rank every group against it, and save the scores here.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {mine.map((request) => (
              <li key={request.id}>
                <RequestItem
                  request={request}
                  active={request.id === selectedId}
                  onSelect={() => onSelect(request.id)}
                  onDelete={() => onDelete(request)}
                />
              </li>
            ))}
          </ul>
        )}

        {samples.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <button
              type="button"
              aria-expanded={showSamples}
              onClick={() => setSamplesOpen((open) => !open)}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Try a sample ({samples.length})
              </span>
              <ChevronDownIcon
                className={cn("size-4 text-muted-foreground transition-transform", showSamples && "rotate-180")}
                aria-hidden
              />
            </button>
            {showSamples && (
              <ul className="mt-1 flex flex-col gap-1">
                {samples.map((request) => (
                  <li key={request.id}>
                    <RequestItem request={request} active={request.id === selectedId} onSelect={() => onSelect(request.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import { CheckIcon, ExternalLinkIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { CONFIDENCE_STYLES } from "@/config/constants";
import { ROUTES } from "@/config/constants";
import { levelLabel, modeLabel, slotLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { MatchItem, RequestSummary } from "@/schemas/matching";
import { ScoreRing } from "./score-ring";

function Chips({
  title,
  items,
  highlight = [],
}: {
  title: string;
  items: string[];
  highlight?: string[];
}) {
  if (items.length === 0) return null;
  const mine = new Set(highlight.map((h) => h.toLowerCase()));
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item}>
            <Badge
              variant={mine.has(item.toLowerCase()) ? "default" : "secondary"}
              className="h-6 px-2.5 text-xs"
            >
              {item}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Full breakdown for one group. A side panel on desktop, a bottom sheet on phones. */
export function MatchSheet({
  match,
  request,
  onClose,
}: {
  match: MatchItem | null;
  request: RequestSummary | null;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const style = match ? CONFIDENCE_STYLES[match.confidence] : null;

  return (
    <Sheet open={match !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "gap-0 overflow-y-auto p-0",
          isMobile ? "max-h-[88svh] rounded-t-3xl" : "w-full sm:max-w-lg",
        )}
      >
        {match && style && request && (
          <>
            <SheetHeader className="flex-row items-center gap-4 border-b p-6">
              <ScoreRing
                score={match.score}
                confidence={match.confidence}
                size={72}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <SheetTitle className="font-heading text-xl leading-snug font-semibold">
                  {match.group.name}
                </SheetTitle>
                <SheetDescription>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      style.chip,
                    )}
                  >
                    {style.label}
                  </span>
                  <span className="ml-2">
                    {levelLabel(match.group.level)} ·{" "}
                    {modeLabel(match.group.mode)}
                    {match.group.location ? ` · ${match.group.location}` : ""}
                  </span>
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-7 p-6">
              <Link
                href={ROUTES.group(match.group.id)}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                View the group page
                <ExternalLinkIcon className="size-4" aria-hidden />
              </Link>
              {match.group.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {match.group.description}
                </p>
              )}

              <section className="flex flex-col gap-2.5">
                <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Why it matches
                </h3>
                <ul className="flex flex-col gap-2">
                  {match.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <CheckIcon
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden
                      />
                      {reason}
                    </li>
                  ))}
                  {match.caveats.map((caveat) => (
                    <li
                      key={caveat}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <TriangleAlertIcon
                        className="mt-0.5 size-4 shrink-0 text-warning"
                        aria-hidden
                      />
                      {caveat}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  How the {Math.round(match.score)} adds up
                </h3>
                <ul className="flex flex-col gap-3">
                  {match.signals.map((signal) => (
                    <li key={signal.key} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{signal.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {signal.points} / {signal.weight}
                        </span>
                      </div>
                      <div
                        aria-hidden
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className={cn("h-full rounded-full", style.bar)}
                          style={{ width: `${signal.ratio * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {signal.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <Chips
                title="Skills it covers"
                items={match.group.skills}
                highlight={request.skills}
              />
              <Chips
                title="Topics"
                items={match.group.interests}
                highlight={request.interests}
              />
              <Chips
                title="When it meets"
                items={match.group.availability.map(slotLabel)}
                highlight={request.availability.map(slotLabel)}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { levelLabel, modeLabel } from "@/lib/labels";
import type { RequestSummary } from "@/schemas/matching";

const ownerOf = (request: RequestSummary) =>
  request.kind === "sample" ? (request.ownerName ?? "Sample") : "You";

/** The current request as a button; the full list opens in a menu. */
export function RequestSelect({
  requests,
  selected,
  onSelect,
}: {
  requests: RequestSummary[];
  selected: RequestSummary | null;
  onSelect: (id: string) => void;
}) {
  const mine = requests.filter((request) => request.kind === "mine");
  const samples = requests.filter((request) => request.kind === "sample");

  const items = (list: RequestSummary[]) =>
    list.map((request) => (
      <DropdownMenuRadioItem
        key={request.id}
        value={request.id}
        className="items-start py-2"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm leading-snug font-medium">
            {request.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {ownerOf(request)} · {levelLabel(request.level)} ·{" "}
            {modeLabel(request.mode)}
          </span>
        </span>
      </DropdownMenuRadioItem>
    ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border bg-background px-4 py-3 text-left transition-colors outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-primary"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">
              Finding groups for
            </span>
            <span className="text-sm leading-snug font-semibold sm:text-base">
              {selected?.title ?? "Choose a request"}
            </span>
            {selected && (
              <span className="text-xs text-muted-foreground">
                {ownerOf(selected)} · tap to switch
              </span>
            )}
          </span>
          <ChevronsUpDownIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[26rem] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={selected?.id ?? ""}
          onValueChange={onSelect}
        >
          {mine.length > 0 && (
            <>
              <DropdownMenuLabel>Your requests</DropdownMenuLabel>
              {items(mine)}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>Try a sample</DropdownMenuLabel>
          {items(samples)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

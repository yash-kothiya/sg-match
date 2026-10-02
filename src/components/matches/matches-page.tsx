"use client";

import { InfoIcon, LoaderCircleIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PROFILE_REQUEST_ID } from "@/config/constants";
import { useDeleteRequest, useJoinGroup, useMatches, useRequests } from "@/hooks/matches";
import type { MatchItem, RequestSummary } from "@/schemas/matching";
import type { Profile } from "@/schemas/profile";
import { MatchCard } from "./match-card";
import { MatchSheet } from "./match-sheet";
import { NewRequestDialog } from "./new-request-dialog";
import { ModeFilterBar, type ModeFilter } from "./mode-filter";
import { Notice } from "./notice";
import { RequestList } from "./request-list";
import { RequestSelect } from "./request-select";
import { ScoringExplainer } from "./scoring-explainer";

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Finding matches">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-72 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function MatchesPage({
  initialRequests,
  initialRequestId,
  profile,
}: {
  initialRequests: RequestSummary[];
  initialRequestId?: string;
  profile: Profile;
}) {
  const requests = useRequests(initialRequests).data;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests.find((request) => request.id === initialRequestId)?.id ?? PROFILE_REQUEST_ID,
  );
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<RequestSummary | null>(null);
  const deleteRequest = useDeleteRequest();
  const { join, cancel } = useJoinGroup();
  const [mode, setMode] = useState<ModeFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [explainerOpen, setExplainerOpen] = useState(false);

  const selected = requests.find((request) => request.id === selectedId) ?? null;
  const query = useMatches(selected?.id ?? null);
  const data = query.data;

  const choose = (id: string) => {
    setSelectedId(id);
    setMode("all");
    setOpenId(null);
    window.history.replaceState(null, "", `?request=${encodeURIComponent(id)}`);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const request = toDelete;
    deleteRequest.mutate(request.id, {
      onSuccess: () => {
        toast.success("Request deleted");
        setToDelete(null);
        if (selectedId === request.id) choose(PROFILE_REQUEST_ID);
      },
    });
  };

  const all = useMemo(() => data?.matches ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<ModeFilter, number> = { all: all.length, online: 0, in_person: 0, hybrid: 0 };
    for (const m of all) c[m.group.mode] += 1;
    return c;
  }, [all]);
  const visible: MatchItem[] = useMemo(() => all.filter((m) => mode === "all" || m.group.mode === mode), [all, mode]);
  const open = all.find((m) => m.group.id === openId) ?? null;

  return (
    // Desktop: the page is exactly one screen tall and the two panels scroll on their own. It cancels
    // most of the shell's 2rem gutter (-m-5 leaves 0.75rem), so 2.5rem = inset margin (1rem) + that
    // 0.75rem gutter on top and bottom. Below lg everything stacks and the page scrolls normally.
    <div className="flex flex-col gap-4 lg:-m-5 lg:h-[calc(100svh-2.5rem)] lg:overflow-hidden">
      {requests.length === 0 ? (
        <Notice icon={SearchXIcon} title="No study requests yet">
          There&apos;s nothing to match yet. Seed the sample requests with <code>bun run db:seed all</code>.
        </Notice>
      ) : (
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          <RequestList
            requests={requests}
            selectedId={selectedId}
            onSelect={choose}
            onCreate={() => setCreating(true)}
            onDelete={setToDelete}
          />

          <section
            aria-label="Matches"
            className="flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-sm lg:h-full lg:min-h-0"
          >
            {/* Fixed header: which request, how many, and the format filter */}
            <header className="flex shrink-0 flex-col gap-3 border-b px-5 py-4">
              {/* Phones and tablets: the left list collapses into a dropdown */}
              <div className="lg:hidden">
                <RequestSelect requests={requests} selected={selected} onSelect={choose} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-xl font-semibold">
                  {selected?.kind === "profile" ? "Groups that fit your profile" : <>Matches for &ldquo;{selected?.title}&rdquo;</>}
                </h2>
                <Button variant="outline" size="sm" onClick={() => setExplainerOpen(true)} disabled={!data}>
                  <InfoIcon aria-hidden />
                  How scoring works
                </Button>
              </div>
              {data && (
                <p className="-mt-2 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                  {visible.length} of the top {all.length} · {data.considered} open groups scored
                  {query.isFetching && <LoaderCircleIcon className="size-4 animate-spin" aria-label="Updating" />}
                </p>
              )}
              {data && all.length > 0 && <ModeFilterBar mode={mode} onChange={setMode} counts={counts} />}
            </header>

            {/* Scrolling results, using the full width and the remaining height */}
            <div className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 lg:min-h-0 lg:overflow-y-auto">
              {query.isPending && selected ? (
                <ResultsSkeleton />
              ) : query.isError ? (
                <Notice
                  icon={TriangleAlertIcon}
                  title="We couldn't load matches"
                  action={
                    <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
                      {query.isFetching && <LoaderCircleIcon className="animate-spin" aria-hidden />}
                      Try again
                    </Button>
                  }
                >
                  {query.error.message}
                </Notice>
              ) : data && all.length === 0 ? (
                <Notice icon={SearchXIcon} title="No open groups fit this request yet">
                  Every group is either full or already yours. Try another request.
                </Notice>
              ) : data && visible.length === 0 ? (
                <Notice
                  icon={SearchXIcon}
                  title="No groups with that format"
                  action={
                    <Button variant="outline" onClick={() => setMode("all")}>
                      Show all formats
                    </Button>
                  }
                >
                  None of the top matches meet that way.
                </Notice>
              ) : data ? (
                <ol className="flex flex-col gap-4">
                  {visible.map((match) => (
                    <li key={match.group.id}>
                      <MatchCard
                        match={match}
                        rank={all.indexOf(match) + 1}
                        onOpen={() => setOpenId(match.group.id)}
                        onJoin={() =>
                          join.mutate(match.group.id, {
                            onSuccess: () => toast.success(`Request sent to ${match.group.name}`),
                          })
                        }
                        onCancelJoin={() =>
                          cancel.mutate(match.group.id, { onSuccess: () => toast.success("Request cancelled") })
                        }
                        joinBusy={
                          (join.isPending && join.variables === match.group.id) ||
                          (cancel.isPending && cancel.variables === match.group.id)
                        }
                      />
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>

            <ConfirmDialog
              open={toDelete !== null}
              onOpenChange={(open) => !open && setToDelete(null)}
              title="Delete this request?"
              description={
                <>
                  <strong className="font-medium text-foreground">{toDelete?.title}</strong> will be removed along with
                  its matches. This can&apos;t be undone.
                </>
              }
              confirmLabel="Delete request"
              pendingLabel="Deleting…"
              pending={deleteRequest.isPending}
              onConfirm={confirmDelete}
            />

            <NewRequestDialog
              open={creating}
              onOpenChange={setCreating}
              profile={profile}
              onCreated={(id) => {
                setCreating(false);
                choose(id);
              }}
            />

            {data && (
              <>
                <MatchSheet match={open} request={selected} onClose={() => setOpenId(null)} />

                <Sheet open={explainerOpen} onOpenChange={setExplainerOpen}>
                  <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
                    <SheetHeader className="border-b p-6">
                      <SheetTitle className="font-heading text-xl font-semibold">How scoring works</SheetTitle>
                      <SheetDescription>The same rules are applied to every group, so results are repeatable.</SheetDescription>
                    </SheetHeader>
                    <div className="p-6">
                      <ScoringExplainer method={data.method} considered={data.considered} bare />
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

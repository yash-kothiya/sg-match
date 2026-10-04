import {
  ArrowRightIcon,
  BellIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClockIcon,
  FileTextIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/matches/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { levelLabel, modeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { getDashboard } from "@/services/dashboard.service";

type Data = Awaited<ReturnType<typeof getDashboard>>;

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
      <ArrowRightIcon className="size-4" aria-hidden />
    </Link>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  href,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
        highlight && "border-sidebar-primary/60 bg-sidebar-primary/10",
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          highlight ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="font-heading text-3xl leading-none font-semibold tabular-nums">{value}</span>
        <span className="mt-1 text-sm text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function Dashboard({ data }: { data: Data }) {
  const { profile, strength, myGroups, sent, toReview, pendingToReview, myRequests, focus, topMatches } = data;
  const firstName = profile.name.split(" ")[0];

  // What needs the student's attention, most urgent first.
  const attention: { key: string; icon: React.ComponentType<{ className?: string }>; text: React.ReactNode; href: string; urgent?: boolean }[] = [
    ...toReview.map((group) => ({
      key: `review-${group.id}`,
      icon: BellIcon,
      urgent: true,
      href: ROUTES.group(group.id),
      text: (
        <>
          <strong className="font-semibold">{group.pendingCount}</strong>{" "}
          {group.pendingCount === 1 ? "person wants" : "people want"} to join <strong className="font-semibold">{group.name}</strong>
        </>
      ),
    })),
    ...sent.map((group) => ({
      key: `sent-${group.id}`,
      icon: ClockIcon,
      href: ROUTES.group(group.id),
      text: (
        <>
          Waiting for <strong className="font-semibold">{group.name}</strong> to reply
        </>
      ),
    })),
    ...(strength.percent < 100
      ? [{ key: "profile", icon: FileTextIcon, href: ROUTES.profile, text: <>Finish your profile ({strength.percent}% done) for better matches</> }]
      : []),
    ...(myRequests.length === 0
      ? [{ key: "request", icon: SparklesIcon, href: ROUTES.matches, text: <>Create a study request to get ranked groups</> }]
      : []),
  ];

  return (
    <>
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sidebar via-sidebar to-primary p-6 text-primary-foreground shadow-lg sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-72 rounded-full bg-white/8" />
        <div aria-hidden className="pointer-events-none absolute right-40 -bottom-16 size-44 rounded-full bg-white/6" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Welcome back, {firstName}</h1>
            <p className="max-w-xl text-primary-foreground/80">
              {pendingToReview > 0
                ? `${pendingToReview} ${pendingToReview === 1 ? "person is" : "people are"} waiting to join your groups.`
                : myGroups.length > 0
                  ? `You're in ${myGroups.length} study ${myGroups.length === 1 ? "group" : "groups"}. Here's what's happening.`
                  : "Find a study group that fits how you learn."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.matches}>
                <SparklesIcon aria-hidden />
                Find matches
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-white/10 text-primary-foreground hover:bg-white/20">
              <Link href={ROUTES.groups}>
                <PlusIcon aria-hidden />
                New group
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={UsersIcon} value={myGroups.length} label="My groups" href={ROUTES.groups} />
        <Stat icon={SparklesIcon} value={myRequests.length} label="My requests" href={ROUTES.matches} />
        <Stat icon={ClockIcon} value={sent.length} label="Waiting for a reply" href={ROUTES.groups} />
        <Stat icon={BellIcon} value={pendingToReview} label="To review" href={ROUTES.groups} highlight={pendingToReview > 0} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Top matches */}
          <Panel
            title={focus ? `Top matches for "${focus.title}"` : "Top matches"}
            action={focus ? <SeeAll href={`${ROUTES.matches}?request=${encodeURIComponent(focus.id)}`}>See all</SeeAll> : undefined}
          >
            {!focus ? (
              <Empty
                title="No study request yet"
                body="Tell us what you want to study and we'll rank every group against it, with the reasons."
                action={
                  <Button asChild size="sm">
                    <Link href={ROUTES.matches}>Create a request</Link>
                  </Button>
                }
              />
            ) : topMatches.length === 0 ? (
              <Empty title="No open groups fit yet" body="Every group is full or already yours. Check back, or create your own group." />
            ) : (
              <ol className="flex flex-col divide-y">
                {topMatches.map((match, index) => (
                  <li key={match.group.id} className="py-3.5 first:pt-0 last:pb-0">
                    <Link
                      href={ROUTES.group(match.group.id)}
                      className="group flex items-center gap-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <ScoreRing score={match.score} confidence={match.confidence} size={52} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold group-hover:underline">{match.group.name}</span>
                          {index === 0 && <Badge className="h-5 bg-sidebar-primary text-sidebar-primary-foreground">Best</Badge>}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {match.group.subject} · {levelLabel(match.group.level)} · {modeLabel(match.group.mode)}
                        </span>
                        {match.reasons[0] && <span className="truncate text-xs text-muted-foreground">{match.reasons[0]}</span>}
                      </span>
                      <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:block">
                        {match.group.spotsLeft} {match.group.spotsLeft === 1 ? "spot" : "spots"} left
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {/* My groups */}
          <Panel title="My groups" action={myGroups.length > 0 ? <SeeAll href={ROUTES.groups}>Manage</SeeAll> : undefined}>
            {myGroups.length === 0 ? (
              <Empty
                title="You're not in a group yet"
                body="Browse open groups and ask to join, or start your own."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href={ROUTES.groups}>Explore groups</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {myGroups.slice(0, 4).map((group) => (
                  <li key={group.id}>
                    <Link
                      href={ROUTES.group(group.id)}
                      className="flex h-full flex-col gap-2 rounded-2xl border p-4 outline-none transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{group.name}</span>
                        {group.myStatus === "owner" && <Badge className="h-5">Owner</Badge>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.subject} · {modeLabel(group.mode)}
                      </span>
                      <span className="mt-auto flex items-center justify-between text-xs">
                        <span className="text-muted-foreground tabular-nums">
                          {group.memberCount}/{group.maxMembers} members
                        </span>
                        {group.pendingCount > 0 && (
                          <span className="font-semibold text-warning-foreground">{group.pendingCount} to review</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {/* Attention */}
          <Panel title="Needs your attention">
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl bg-success/10 p-4 text-sm font-medium text-success">
                <CheckCircle2Icon className="size-5 shrink-0" aria-hidden />
                You&apos;re all caught up.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {attention.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl p-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                        item.urgent ? "bg-sidebar-primary/15 hover:bg-sidebar-primary/25" : "hover:bg-muted",
                      )}
                    >
                      <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span>{item.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Profile strength */}
          <Panel title="Profile strength" action={<SeeAll href={ROUTES.profile}>Edit</SeeAll>}>
            <div className="flex items-center gap-4">
              <div
                role="progressbar"
                aria-valuenow={strength.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile strength"
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${strength.percent}%` }} />
              </div>
              <span className="text-sm font-semibold text-primary tabular-nums">{strength.percent}%</span>
            </div>
            <ul className="flex flex-col gap-2">
              {strength.checks.map((check) => (
                <li key={check.label} className={cn("flex items-center gap-2 text-sm", check.done ? "text-foreground" : "text-muted-foreground")}>
                  {check.done ? (
                    <CheckCircle2Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <CircleIcon className="size-4 shrink-0" aria-hidden />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

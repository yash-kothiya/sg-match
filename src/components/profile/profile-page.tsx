"use client";

import {
  BookOpenIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleIcon,
  Loader2Icon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { FormProvider } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import {
  AboutFields,
  AvailabilityFields,
  SkillsField,
  StudyFields,
} from "@/components/profile/profile-fields";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPERIENCE_LEVELS, STUDY_MODES } from "@/config/constants";
import { useProfile, useProfileForm } from "@/hooks/profile";
import type { Profile } from "@/schemas/profile";

const SECTIONS = [
  { id: "account", title: "Account", description: "How you appear to other students.", icon: UserIcon },
  { id: "about", title: "About you", description: "Where you study and a line about yourself.", icon: BookOpenIcon },
  { id: "study", title: "Study preferences", description: "Your level and how you like to meet.", icon: UsersIcon },
  { id: "skills", title: "Skills", description: "What you already know. More skills mean better matches.", icon: SparklesIcon },
  { id: "time", title: "Time and topics", description: "When you're free and what you want to learn.", icon: CalendarClockIcon },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** What's still missing from the saved profile; drives the completeness card. */
function completeness(profile: Profile) {
  const checks = [
    { label: "School or university", done: Boolean(profile.university) },
    { label: "A short bio", done: Boolean(profile.bio) },
    { label: "Study preferences", done: Boolean(profile.experienceLevel && profile.studyMode) },
    { label: "At least one skill", done: profile.skills.length > 0 },
    { label: "Availability", done: profile.availability.length > 0 },
    { label: "Topics you want to study", done: profile.interests.length > 0 },
  ];
  const done = checks.filter((check) => check.done).length;
  return { checks, percent: Math.round((done / checks.length) * 100) };
}

function SectionCard({
  id,
  title,
  description,
  icon: Icon,
  children,
}: (typeof SECTIONS)[number] & { children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
    >
      <header className="mb-7 flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="flex flex-col gap-7">{children}</div>
    </section>
  );
}

/** Profile page. Every field is live-editable; a floating bar appears when there is something to save. */
export function ProfilePage({ initialProfile }: { initialProfile: Profile }) {
  const { data: profile } = useProfile(initialProfile);
  const { form, onSubmit, discard, isDirty, isPending } = useProfileForm(profile);
  const {
    register,
    formState: { errors },
  } = form;

  const level = EXPERIENCE_LEVELS.find((option) => option.value === profile.experienceLevel);
  const mode = STUDY_MODES.find((option) => option.value === profile.studyMode);
  const { checks, percent } = completeness(profile);

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sidebar via-sidebar to-primary px-6 pt-10 pb-8 text-primary-foreground sm:px-10 sm:pt-14">
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-72 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute top-24 right-40 size-40 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-black/10" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="size-20 ring-4 ring-white/30 sm:size-24">
              <AvatarFallback className="bg-white text-2xl font-semibold text-primary sm:text-3xl">
                {initials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="truncate text-3xl font-semibold sm:text-4xl">{profile.name}</h1>
              <p className="truncate text-sm text-primary-foreground/80">{profile.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-primary-foreground capitalize hover:bg-white/20">{profile.role}</Badge>
                {level && <Badge className="bg-white/20 text-primary-foreground hover:bg-white/20">{level.label}</Badge>}
                {mode && <Badge className="bg-white/20 text-primary-foreground hover:bg-white/20">{mode.label}</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[17rem_1fr]">
          {/* Side summary */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Profile strength</h2>
                <span className="text-sm font-semibold text-primary">{percent}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile strength"
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {checks.map((check) => (
                  <li
                    key={check.label}
                    className={`flex items-center gap-2 text-sm ${check.done ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {check.done ? (
                      <CheckCircle2Icon className="size-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <CircleIcon className="size-4 shrink-0" aria-hidden />
                    )}
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>

            <nav aria-label="Profile sections" className="hidden rounded-2xl border bg-card p-2 shadow-sm lg:block">
              <ul className="flex flex-col">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <section.icon className="size-4" aria-hidden />
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Editable sections */}
          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard {...SECTIONS[0]}>
              <FormField label="Name" autoComplete="name" error={errors.name} {...register("name")} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled readOnly />
                <p className="text-xs text-muted-foreground">Your email is your sign-in and can&apos;t be changed here.</p>
              </div>
            </SectionCard>

            <SectionCard {...SECTIONS[1]}>
              <AboutFields />
            </SectionCard>

            <SectionCard {...SECTIONS[2]}>
              <StudyFields />
            </SectionCard>

            <SectionCard {...SECTIONS[3]}>
              <SkillsField />
            </SectionCard>

            <SectionCard {...SECTIONS[4]}>
              <AvailabilityFields />
            </SectionCard>

            {/* Floating save bar: always visible; actions appear once there is something to save */}
            <div
              role="region"
              aria-label="Save changes"
              aria-live="polite"
              className="sticky bottom-4 z-30 mx-auto flex min-h-[4.25rem] w-full max-w-xl items-center justify-between gap-4 rounded-2xl border bg-card/95 p-3 pl-5 shadow-xl shadow-primary/10 backdrop-blur"
            >
              {isDirty ? (
                <>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span aria-hidden className="size-2 rounded-full bg-primary" />
                    You have unsaved changes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={discard} disabled={isPending}>
                      Discard
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
                      {isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="size-4 text-primary" aria-hidden />
                    All changes saved
                  </p>
                  <Button type="submit" disabled>
                    Save changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

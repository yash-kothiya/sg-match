"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, LogOutIcon } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { Brand } from "@/components/common/brand";
import { SubmitButton } from "@/components/common/submit-button";
import {
  AboutFields,
  AvailabilityFields,
  SkillsField,
  StudyFields,
} from "@/components/profile/profile-fields";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "@/config/constants";
import { useSignOut } from "@/hooks/auth";
import { useOnboardingForm } from "@/hooks/profile";
import { cn } from "@/lib/utils";

/** Split-screen setup flow: a stepper rail on the left, one focused question group on the right. */
export function OnboardingWizard({ firstName }: { firstName: string }) {
  const { form, step, isFirstStep, isLastStep, next, back, goTo, submit, isPending } =
    useOnboardingForm();
  const signOut = useSignOut();

  const current = ONBOARDING_STEPS[step];

  return (
    <FormProvider {...form}>
    <div className="grid min-h-svh flex-1 lg:grid-cols-[22rem_1fr]">
      {/* Desktop rail */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-white/5" />
        <div aria-hidden className="pointer-events-none absolute -top-16 -left-20 size-64 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-10">
          <Brand inverted className="text-sidebar-foreground" />

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-tight font-semibold">Welcome, {firstName}</h1>
            <p className="text-sm text-sidebar-foreground/75">
              Answer a few questions and we&apos;ll match you with study groups that fit.
            </p>
          </div>

          <ol className="flex flex-col" aria-label="Setup steps">
            {ONBOARDING_STEPS.map((item, index) => {
              const done = index < step;
              const active = index === step;
              const isLast = index === ONBOARDING_STEPS.length - 1;
              return (
                <li key={item.title} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-9 left-4 h-[calc(100%-2.25rem)] w-px -translate-x-1/2",
                        done ? "bg-sidebar-primary" : "bg-white/20",
                      )}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    disabled={!done || isPending}
                    aria-current={active ? "step" : undefined}
                    className="flex gap-4 text-left disabled:cursor-default"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                        done && "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground",
                        active && "border-white bg-white text-sidebar",
                        !done && !active && "border-white/25 text-sidebar-foreground/60",
                      )}
                    >
                      {done ? <CheckIcon className="size-4" aria-hidden /> : index + 1}
                    </span>
                    <span className="flex flex-col gap-0.5 pt-0.5">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          !active && !done && "text-sidebar-foreground/60",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          active ? "text-sidebar-foreground/80" : "text-sidebar-foreground/50",
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => signOut.mutate()}
          disabled={isPending || signOut.isPending}
          className="relative w-fit text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
        >
          <LogOutIcon aria-hidden />
          Sign out
        </Button>
      </aside>

      <form
        noValidate
        className="flex min-w-0 flex-col"
        onSubmit={(event) => {
          // Enter inside a field should advance the wizard, not submit the whole profile early.
          if (isLastStep) return submit(event);
          event.preventDefault();
          return next();
        }}
      >
        {/* Mobile header */}
        <header className="flex flex-col gap-3 border-b bg-card px-4 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Brand />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => signOut.mutate()}
              disabled={isPending || signOut.isPending}
              className="text-muted-foreground"
            >
              Sign out
            </Button>
          </div>
          <ol className="flex gap-1.5" aria-label="Progress">
            {ONBOARDING_STEPS.map((item, index) => (
              <li
                key={item.title}
                aria-current={index === step ? "step" : undefined}
                className={cn("h-1.5 flex-1 rounded-full", index <= step ? "bg-primary" : "bg-border")}
              />
            ))}
          </ol>
        </header>

        <main className="flex flex-1 justify-center px-4 py-8 sm:px-8 lg:px-14 lg:py-14">
          {/* key re-mounts the block so each step eases in */}
          <div
            key={step}
            className="flex w-full max-w-2xl flex-col gap-8 animate-in duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                Step {step + 1} of {ONBOARDING_STEPS.length}
              </p>
              <h2 className="text-3xl font-semibold sm:text-4xl">{current.title}</h2>
              <p className="text-muted-foreground">{current.description}</p>
            </div>

            <div className="flex flex-col gap-7">
              {step === 0 && <AboutFields />}
              {step === 1 && <StudyFields />}
              {step === 2 && <SkillsField />}
              {step === 3 && <AvailabilityFields />}
            </div>
          </div>
        </main>

        {/* Pinned action bar */}
        <footer className="sticky bottom-0 border-t bg-background/90 px-4 py-4 backdrop-blur sm:px-8 lg:px-14">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
            {isFirstStep ? (
              <span />
            ) : (
              <Button type="button" variant="outline" size="lg" onClick={back} disabled={isPending}>
                <ArrowLeftIcon aria-hidden />
                Back
              </Button>
            )}
            <SubmitButton
              isPending={isPending}
              pendingLabel="Saving…"
              className="w-auto min-w-40 flex-1 sm:flex-none"
            >
              {isLastStep ? (
                "Finish setup"
              ) : (
                <>
                  Continue
                  <ArrowRightIcon aria-hidden />
                </>
              )}
            </SubmitButton>
          </div>
        </footer>
      </form>
    </div>
    </FormProvider>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ONBOARDING_STEPS, ROUTES } from "@/config/constants";
import { onboardingSchema, ONBOARDING_STEP_FIELDS, type OnboardingInput } from "@/schemas/profile";
import { profileApi, queryKeys } from "@/utils";

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.completeOnboarding,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

/** Wizard state (current step) on top of one React Hook Form instance for the whole profile. */
export function useOnboardingForm() {
  const router = useRouter();
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(0);

  const form = useForm<OnboardingInput>({
    mode: "onTouched",
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      university: "",
      bio: "",
      experienceLevel: undefined,
      studyMode: undefined,
      location: "",
      skillIds: [],
      availability: [],
      interests: [],
    },
  });

  const lastStep = ONBOARDING_STEPS.length - 1;

  /** Validates only the current step's fields, then moves on. */
  const next = async () => {
    const valid = await form.trigger([...ONBOARDING_STEP_FIELDS[step]], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, lastStep));
  };

  const back = () => setStep((current) => Math.max(current - 1, 0));

  /** Completed steps can be revisited; skipping ahead still goes through `next` so each step is validated. */
  const goTo = (target: number) => setStep((current) => (target < current ? target : current));

  const submit = form.handleSubmit(async (values) => {
    try {
      await complete.mutateAsync(values);
      toast.success("Profile saved. Let's find your group.");
      router.replace(ROUTES.home);
      router.refresh();
    } catch {
      // The error toast comes from the global MutationCache.
    }
  });

  return {
    form,
    step,
    isFirstStep: step === 0,
    isLastStep: step === lastStep,
    next,
    back,
    goTo,
    submit,
    isPending: complete.isPending,
  };
}

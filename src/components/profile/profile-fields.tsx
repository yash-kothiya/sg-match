"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ChipSelect } from "@/components/common/chip-select";
import { ChoiceCards } from "@/components/common/choice-cards";
import { FieldShell, FormField } from "@/components/common/form-field";
import { SkillPicker } from "@/components/common/skill-picker";
import { TagInput } from "@/components/common/tag-input";
import { Textarea } from "@/components/ui/textarea";
import {
  AVAILABILITY_OPTIONS,
  BIO_MAX_LENGTH,
  EXPERIENCE_LEVELS,
  INTEREST_SUGGESTIONS,
  MAX_INTERESTS,
  MAX_SKILLS,
  STUDY_MODES,
} from "@/config/constants";
import { useSkills } from "@/hooks/profile";
import type { OnboardingInput } from "@/schemas/profile";

/*
 * Field groups shared by the onboarding wizard and the profile editor. They read the form
 * from context, so each caller wraps them in a <FormProvider> whose values include
 * OnboardingInput (the profile form simply has extra fields, e.g. `name`).
 */

export function AboutFields() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const bioLength = watch("bio")?.length ?? 0;

  return (
    <>
      <FormField
        label="School or university"
        autoComplete="organization"
        placeholder="e.g. National University of Singapore"
        error={errors.university}
        {...register("university")}
      />
      <FieldShell
        label="About you (optional)"
        htmlFor="bio"
        error={errors.bio}
        hint={`${bioLength}/${BIO_MAX_LENGTH}`}
      >
        <Textarea
          id="bio"
          rows={5}
          placeholder="What are you studying, and what do you want from a study group?"
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby={errors.bio ? "bio-error" : undefined}
          {...register("bio")}
        />
      </FieldShell>
    </>
  );
}

export function StudyFields() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const studyMode = watch("studyMode");

  return (
    <>
      <FieldShell label="Experience level" error={errors.experienceLevel}>
        <Controller
          control={control}
          name="experienceLevel"
          render={({ field }) => (
            <ChoiceCards
              name={field.name}
              options={EXPERIENCE_LEVELS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(errors.experienceLevel)}
            />
          )}
        />
      </FieldShell>
      <FieldShell label="How do you like to study?" error={errors.studyMode}>
        <Controller
          control={control}
          name="studyMode"
          render={({ field }) => (
            <ChoiceCards
              name={field.name}
              options={STUDY_MODES}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(errors.studyMode)}
            />
          )}
        />
      </FieldShell>
      <FormField
        label={studyMode === "online" || !studyMode ? "City or campus (optional)" : "City or campus"}
        autoComplete="address-level2"
        placeholder="e.g. Singapore"
        error={errors.location}
        {...register("location")}
      />
    </>
  );
}

export function SkillsField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const skills = useSkills();

  return (
    <FieldShell label="Skills you already have (optional)" error={errors.skillIds}>
      <Controller
        control={control}
        name="skillIds"
        render={({ field }) => (
          <SkillPicker
            skills={skills.data}
            isLoading={skills.isPending}
            errorMessage={skills.error?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            max={MAX_SKILLS}
          />
        )}
      />
    </FieldShell>
  );
}

export function AvailabilityFields() {
  const {
    control,
    formState: { errors },
  } = useFormContext<OnboardingInput>();

  return (
    <>
      <FieldShell label="When are you usually free?" error={errors.availability}>
        <Controller
          control={control}
          name="availability"
          render={({ field }) => (
            <ChipSelect
              options={AVAILABILITY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(errors.availability)}
            />
          )}
        />
      </FieldShell>
      <FieldShell
        label="What do you want to study?"
        htmlFor="interests"
        error={errors.interests}
        hint={`Press Enter to add a topic. Up to ${MAX_INTERESTS}.`}
      >
        <Controller
          control={control}
          name="interests"
          render={({ field }) => (
            <TagInput
              id="interests"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              suggestions={INTEREST_SUGGESTIONS}
              max={MAX_INTERESTS}
              placeholder="e.g. Algorithms"
              invalid={Boolean(errors.interests)}
            />
          )}
        />
      </FieldShell>
    </>
  );
}

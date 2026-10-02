"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldShell, FormField } from "@/components/common/form-field";
import { AvailabilityFields, SkillsField, StudyFields } from "@/components/profile/profile-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AVAILABILITY_OPTIONS } from "@/config/constants";
import { useCreateRequest } from "@/hooks/matches";
import { useServerFieldErrors } from "@/hooks/use-server-field-errors";
import type { Profile, StudyRequestInput } from "@/schemas/profile";
import { studyRequestSchema } from "@/schemas/profile";

const SERVER_FIELDS = ["title", "subject", "skillIds"] as const;
const validSlots = new Set<string>(AVAILABILITY_OPTIONS.map((option) => option.value));

/** Starts from the student's profile so most fields are already right; they only name the goal. */
function defaultsFrom(profile: Profile): StudyRequestInput {
  return {
    title: "",
    subject: "",
    description: "",
    experienceLevel: profile.experienceLevel ?? (undefined as never),
    studyMode: profile.studyMode ?? (undefined as never),
    location: profile.location ?? "",
    skillIds: profile.skills.map((skill) => skill.id),
    availability: profile.availability.filter((slot) => validSlots.has(slot)) as StudyRequestInput["availability"],
    interests: profile.interests,
  };
}

function NewRequestForm({ profile, onCreated }: { profile: Profile; onCreated: (id: string) => void }) {
  const create = useCreateRequest();
  const form = useForm<StudyRequestInput>({
    mode: "onTouched",
    resolver: zodResolver(studyRequestSchema),
    defaultValues: defaultsFrom(profile),
  });
  const applyServerErrors = useServerFieldErrors(form, SERVER_FIELDS);
  const {
    register,
    formState: { errors },
  } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const id = await create.mutateAsync(values);
      toast.success("Request created. Here are your matches.");
      onCreated(id);
    } catch (error) {
      applyServerErrors(error); // the toast comes from the global MutationCache
    }
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-7 overflow-y-auto p-6">
          <FormField
            label="What are you looking for?"
            placeholder="e.g. Interview prep for the summer"
            error={errors.title}
            {...register("title")}
          />
          <FormField label="Subject" placeholder="e.g. Algorithms" error={errors.subject} {...register("subject")} />
          <FieldShell label="More detail (optional)" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              rows={3}
              placeholder="What do you want from the group?"
              aria-invalid={errors.description ? true : undefined}
              {...register("description")}
            />
          </FieldShell>
          <StudyFields />
          <SkillsField />
          <AvailabilityFields />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-card p-4">
          <Button type="submit" size="lg" disabled={create.isPending}>
            {create.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
            {create.isPending ? "Creating…" : "Create and find groups"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export function NewRequestDialog({
  open,
  onOpenChange,
  profile,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  onCreated: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90svh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="font-heading text-xl font-semibold">New study request</DialogTitle>
          <DialogDescription>
            Tell us what you want to study. We filled in the rest from your profile; change anything that&apos;s
            different this time.
          </DialogDescription>
        </DialogHeader>
        {/* The form only mounts while open, so it starts from fresh profile defaults every time. */}
        {open && <NewRequestForm profile={profile} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
}

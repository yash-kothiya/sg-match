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
import { AVAILABILITY_OPTIONS, DEFAULT_GROUP_SIZE, MAX_GROUP_SIZE, MIN_GROUP_SIZE } from "@/config/constants";
import { useCreateGroup, useUpdateGroup } from "@/hooks/groups";
import { useServerFieldErrors } from "@/hooks/use-server-field-errors";
import { groupSchema, type GroupDetail, type GroupInput } from "@/schemas/groups";
import type { Profile } from "@/schemas/profile";

const SERVER_FIELDS = ["name", "subject", "skillIds", "maxMembers"] as const;
const validSlots = new Set<string>(AVAILABILITY_OPTIONS.map((option) => option.value));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Creating starts from the profile; editing starts from the group. */
  profile: Profile;
  group?: GroupDetail;
  onDone: (id: string) => void;
};

function defaults({ profile, group }: Pick<Props, "profile" | "group">): GroupInput {
  if (group) {
    return {
      name: group.name,
      subject: group.subject,
      description: group.description ?? "",
      experienceLevel: group.level,
      studyMode: group.mode,
      location: group.location ?? "",
      skillIds: group.skillIds,
      availability: group.availability as GroupInput["availability"],
      interests: group.interests,
      maxMembers: group.maxMembers,
    };
  }
  return {
    name: "",
    subject: "",
    description: "",
    experienceLevel: profile.experienceLevel ?? (undefined as never),
    studyMode: profile.studyMode ?? (undefined as never),
    location: profile.location ?? "",
    skillIds: profile.skills.map((skill) => skill.id),
    availability: profile.availability.filter((slot) => validSlots.has(slot)) as GroupInput["availability"],
    interests: profile.interests,
    maxMembers: DEFAULT_GROUP_SIZE,
  };
}

function GroupForm({ profile, group, onDone }: Pick<Props, "profile" | "group" | "onDone">) {
  const create = useCreateGroup();
  const update = useUpdateGroup();
  const pending = create.isPending || update.isPending;

  const form = useForm<GroupInput>({
    mode: "onTouched",
    resolver: zodResolver(groupSchema),
    defaultValues: defaults({ profile, group }),
  });
  const applyServerErrors = useServerFieldErrors(form, SERVER_FIELDS);
  const {
    register,
    formState: { errors },
  } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (group) {
        await update.mutateAsync({ id: group.id, input: values });
        toast.success("Group updated");
        onDone(group.id);
      } else {
        const id = await create.mutateAsync(values);
        toast.success("Group created");
        onDone(id);
      }
    } catch (error) {
      applyServerErrors(error); // the toast comes from the global MutationCache
    }
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-7 overflow-y-auto p-6">
          <FormField label="Group name" placeholder="e.g. Algorithms Sprint" error={errors.name} {...register("name")} />
          <FormField label="Subject" placeholder="e.g. Algorithms" error={errors.subject} {...register("subject")} />
          <FieldShell label="About the group (optional)" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              rows={3}
              placeholder="What will you work on, and how often will you meet?"
              aria-invalid={errors.description ? true : undefined}
              {...register("description")}
            />
          </FieldShell>
          <FormField
            label="Maximum members"
            type="number"
            inputMode="numeric"
            min={MIN_GROUP_SIZE}
            max={MAX_GROUP_SIZE}
            hint={`Including you. Between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE}.`}
            error={errors.maxMembers}
            {...register("maxMembers", { valueAsNumber: true })}
          />
          <StudyFields />
          <SkillsField />
          <AvailabilityFields />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-card p-4">
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" aria-hidden />}
            {pending ? "Saving…" : group ? "Save changes" : "Create group"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export function GroupFormDialog({ open, onOpenChange, profile, group, onDone }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90svh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-6 pr-14">
          <DialogTitle className="font-heading text-xl font-semibold">
            {group ? "Edit group" : "Create a study group"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Changes show up for everyone right away."
              : "People can find it in Explore and in their matches, and ask to join. You approve who gets in."}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so it always starts from fresh defaults. */}
        {open && <GroupForm profile={profile} group={group} onDone={onDone} />}
      </DialogContent>
    </Dialog>
  );
}

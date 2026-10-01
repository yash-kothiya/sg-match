"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AVAILABILITY_OPTIONS } from "@/config/constants";
import { useServerFieldErrors } from "@/hooks/use-server-field-errors";
import { profileSchema, type Profile, type ProfileInput } from "@/schemas/profile";
import { profileApi, queryKeys } from "@/utils";

const SERVER_FIELDS = ["name", "university", "skillIds"] as const;

/** The signed-in user's profile. The server page passes it in, so the first render needs no request. */
export function useProfile(initialData: Profile) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => profileApi.get(signal),
    initialData,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile, profile);
      // Keep the cached session user in step with a renamed account.
      queryClient.setQueryData(queryKeys.auth.me, (user: { name: string } | undefined) =>
        user ? { ...user, name: profile.name } : user,
      );
    },
  });
}

const validAvailability = new Set<string>(AVAILABILITY_OPTIONS.map((option) => option.value));

export function toFormValues(profile: Profile): ProfileInput {
  return {
    name: profile.name,
    university: profile.university ?? "",
    bio: profile.bio ?? "",
    experienceLevel: profile.experienceLevel ?? (undefined as never),
    studyMode: profile.studyMode ?? (undefined as never),
    location: profile.location ?? "",
    skillIds: profile.skills.map((skill) => skill.id),
    availability: profile.availability.filter((slot) => validAvailability.has(slot)) as ProfileInput["availability"],
    interests: profile.interests,
  };
}

/**
 * The profile page's form. It stays mounted and always editable; `isDirty` drives the save bar.
 * After a successful save the form is reset to the saved values so it is clean again.
 */
export function useProfileForm(profile: Profile) {
  const router = useRouter();
  const update = useUpdateProfile();

  const form = useForm<ProfileInput>({
    mode: "onTouched",
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
  });
  const applyServerErrors = useServerFieldErrors(form, SERVER_FIELDS);
  const { isDirty } = form.formState;

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      form.reset(toFormValues(saved));
      toast.success("Profile saved");
      router.refresh(); // refresh server components that show the name, e.g. the sidebar
    } catch (error) {
      applyServerErrors(error); // the error toast comes from the global MutationCache
    }
  });

  const discard = () => form.reset(toFormValues(profile));

  return { form, onSubmit, discard, isDirty, isPending: update.isPending };
}

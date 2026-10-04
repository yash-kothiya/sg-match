import type { Profile } from "@/schemas/profile";

/** What's still missing from a saved profile. Shared by the profile page and the dashboard. */
export function profileStrength(profile: Profile) {
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

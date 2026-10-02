import { z } from "zod";
import {
  AVAILABILITY_OPTIONS,
  BIO_MAX_LENGTH,
  EXPERIENCE_LEVELS,
  MAX_INTERESTS,
  MAX_SKILLS,
  STUDY_MODES,
} from "@/config/constants";

const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((option) => option.value) as [T[number]["value"], ...T[number]["value"][]];

export const profileFields = z.object({
    // Step 1
    university: z
      .string()
      .trim()
      .min(2, "Enter the school or university you study at")
      .max(120, "That name is too long"),
    bio: z.string().trim().max(BIO_MAX_LENGTH, `Keep it under ${BIO_MAX_LENGTH} characters`),
    // Step 2
    experienceLevel: z.enum(values(EXPERIENCE_LEVELS), "Choose your experience level"),
    studyMode: z.enum(values(STUDY_MODES), "Choose how you like to study"),
    location: z.string().trim().max(120, "That location is too long"),
    // Step 3
    skillIds: z.array(z.string().min(1)).max(MAX_SKILLS, `Pick up to ${MAX_SKILLS} skills`),
    // Step 4
    availability: z
      .array(z.enum(values(AVAILABILITY_OPTIONS)))
      .min(1, "Pick at least one time you're free"),
    interests: z
      .array(z.string().trim().min(1).max(40, "Keep each interest under 40 characters"))
      .min(1, "Add at least one topic")
      .max(MAX_INTERESTS, `Add up to ${MAX_INTERESTS} topics`),
});

/** In-person and hybrid study need a place to meet; online doesn't. */
const locationRule = (data: { studyMode: string; location: string }) =>
  data.studyMode === "online" || data.location.length > 0;
const locationRuleOptions = {
  path: ["location"],
  message: "Add your city or campus so we can find people nearby",
  // Zod skips object-level checks while any field is invalid; run this one whenever a
  // study mode is chosen so a step (or the profile form) can report it on its own.
  when: ({ value }: { value: unknown }) => typeof (value as { studyMode?: unknown }).studyMode === "string",
};

export const onboardingSchema = profileFields.refine(locationRule, locationRuleOptions);

/** The profile page also lets people change their display name. */
export const profileSchema = profileFields
  .extend({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "That name is too long"),
  })
  .refine(locationRule, locationRuleOptions);

/** A study request: what to find a group for, using the same preference fields as the profile. */
export const studyRequestSchema = profileFields
  .omit({ university: true, bio: true })
  .extend({
    title: z.string().trim().min(3, "Give your request a short title").max(100, "Keep the title under 100 characters"),
    subject: z.string().trim().min(2, "What are you studying?").max(80, "That subject is too long"),
    description: z.string().trim().max(400, "Keep it under 400 characters"),
  })
  .refine(locationRule, locationRuleOptions);

export type StudyRequestInput = z.infer<typeof studyRequestSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

/** Fields validated at each wizard step, in order. */
export const ONBOARDING_STEP_FIELDS = [
  ["university", "bio"],
  ["experienceLevel", "studyMode", "location"],
  ["skillIds"],
  ["availability", "interests"],
] as const satisfies readonly (readonly (keyof OnboardingInput)[])[];

/** What the profile page shows and edits. */
export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  university: string | null;
  bio: string | null;
  experienceLevel: OnboardingInput["experienceLevel"] | null;
  studyMode: OnboardingInput["studyMode"] | null;
  location: string | null;
  availability: string[];
  interests: string[];
  skills: SkillOption[];
};

export type SkillOption = { id: string; name: string; category: string | null };

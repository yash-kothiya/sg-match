import { z } from "zod";
import { MAX_GROUP_SIZE, MIN_GROUP_SIZE } from "@/config/constants";
import { profileFields } from "./profile";

type Level = "beginner" | "intermediate" | "advanced";
type Mode = "online" | "in_person" | "hybrid";

/** Create / edit a group: the same preference fields as a profile, plus a name and a size. */
export const groupSchema = profileFields
  .omit({ university: true, bio: true })
  .extend({
    name: z.string().trim().min(3, "Give the group a name").max(80, "Keep the name under 80 characters"),
    subject: z.string().trim().min(2, "What does the group study?").max(80, "That subject is too long"),
    description: z.string().trim().max(500, "Keep it under 500 characters"),
    maxMembers: z
      .number({ error: "Enter a number" })
      .int("Use a whole number")
      .min(MIN_GROUP_SIZE, `A group needs at least ${MIN_GROUP_SIZE} people`)
      .max(MAX_GROUP_SIZE, `Groups can have up to ${MAX_GROUP_SIZE} people`),
  })
  .refine((data) => data.studyMode === "online" || data.location.length > 0, {
    path: ["location"],
    message: "Add the city or campus where the group meets",
    when: ({ value }) => typeof (value as { studyMode?: unknown }).studyMode === "string",
  });

export type GroupInput = z.infer<typeof groupSchema>;

export const memberDecisionSchema = z.object({ status: z.enum(["accepted", "rejected"]) });

export const groupsQuerySchema = z.object({
  scope: z.enum(["explore", "mine", "requests"]).default("explore"),
  q: z.string().trim().max(80).default(""),
  mode: z.enum(["online", "in_person", "hybrid"]).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  open: z.coerce.boolean().default(false),
});
export type GroupsQuery = z.infer<typeof groupsQuerySchema>;

/** The signed-in user's relationship to a group. */
export type MyStatus = "owner" | "member" | "pending" | "rejected" | "none";

export type GroupCardData = {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  level: Level;
  mode: Mode;
  location: string | null;
  skills: string[];
  memberCount: number;
  maxMembers: number;
  spotsLeft: number;
  myStatus: MyStatus;
  /** Only for groups the user owns. */
  pendingCount: number;
};

export type MemberItem = {
  userId: string;
  name: string;
  university: string | null;
  role: "owner" | "member";
  isMe: boolean;
};

export type PendingItem = {
  userId: string;
  name: string;
  university: string | null;
  bio: string | null;
  skills: string[];
  requestedAt: string;
};

export type GroupDetail = GroupCardData & {
  availability: string[];
  interests: string[];
  ownerName: string | null;
  members: MemberItem[];
  /** Only filled for the owner. */
  pending: PendingItem[];
  /** Skill ids, so the edit form can start from the current values. */
  skillIds: string[];
};

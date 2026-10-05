import { API_ENDPOINTS } from "@/config/constants";
import type { AuthUser, SignInInput, SignUpRequest } from "@/schemas/auth";
import type { ChatResponse } from "@/schemas/chat";
import type { GroupCardData, GroupDetail, GroupInput } from "@/schemas/groups";
import type { MatchesResponse, RequestSummary } from "@/schemas/matching";
import type { OnboardingInput, Profile, ProfileInput, SkillOption, StudyRequestInput } from "@/schemas/profile";
import { axiosClient } from "./axios-client";

type UserResponse = { user: AuthUser };

export const authApi = {
  me: (signal?: AbortSignal) =>
    axiosClient.get<UserResponse>(API_ENDPOINTS.auth.me, { signal }).then((res) => res.data),
  signIn: (input: SignInInput) =>
    axiosClient.post<UserResponse>(API_ENDPOINTS.auth.signIn, input).then((res) => res.data),
  signUp: (input: SignUpRequest) =>
    axiosClient.post<UserResponse>(API_ENDPOINTS.auth.signUp, input).then((res) => res.data),
  signOut: () => axiosClient.post<{ ok: true }>(API_ENDPOINTS.auth.signOut).then((res) => res.data),
};

export const profileApi = {
  get: (signal?: AbortSignal) =>
    axiosClient
      .get<{ profile: Profile }>(API_ENDPOINTS.profile.me, { signal })
      .then((res) => res.data.profile),
  update: (input: ProfileInput) =>
    axiosClient
      .patch<{ profile: Profile }>(API_ENDPOINTS.profile.me, input)
      .then((res) => res.data.profile),
  completeOnboarding: (input: OnboardingInput) =>
    axiosClient
      .post<UserResponse>(API_ENDPOINTS.profile.onboarding, input)
      .then((res) => res.data),
};

export const skillsApi = {
  list: (signal?: AbortSignal) =>
    axiosClient
      .get<{ skills: SkillOption[] }>(API_ENDPOINTS.skills, { signal })
      .then((res) => res.data.skills),
};

export const matchesApi = {
  requests: (signal?: AbortSignal) =>
    axiosClient
      .get<{ requests: RequestSummary[] }>(API_ENDPOINTS.requests, { signal })
      .then((res) => res.data.requests),
  createRequest: (input: StudyRequestInput) =>
    axiosClient.post<{ id: string }>(API_ENDPOINTS.requests, input).then((res) => res.data.id),
  deleteRequest: (requestId: string) =>
    axiosClient.delete<{ ok: true }>(API_ENDPOINTS.request(requestId)).then((res) => res.data),
  forRequest: (requestId: string, limit: number, signal?: AbortSignal) =>
    axiosClient
      .get<MatchesResponse>(API_ENDPOINTS.matches, { params: { requestId, limit }, signal })
      .then((res) => res.data),
};

export const groupsApi = {
  list: (signal?: AbortSignal) =>
    axiosClient.get<{ groups: GroupCardData[] }>(API_ENDPOINTS.groups, { signal }).then((res) => res.data.groups),
  get: (id: string, signal?: AbortSignal) =>
    axiosClient.get<{ group: GroupDetail }>(API_ENDPOINTS.group(id), { signal }).then((res) => res.data.group),
  create: (input: GroupInput) =>
    axiosClient.post<{ id: string }>(API_ENDPOINTS.groups, input).then((res) => res.data.id),
  update: ({ id, input }: { id: string; input: GroupInput }) =>
    axiosClient.patch<{ group: GroupDetail }>(API_ENDPOINTS.group(id), input).then((res) => res.data.group),
  remove: (id: string) => axiosClient.delete<{ ok: true }>(API_ENDPOINTS.group(id)).then((res) => res.data),
  join: (groupId: string) =>
    axiosClient.post<{ status: "pending" }>(API_ENDPOINTS.groupJoin(groupId)).then((res) => res.data),
  cancelJoin: (groupId: string) =>
    axiosClient.delete<{ status: "none" }>(API_ENDPOINTS.groupJoin(groupId)).then((res) => res.data),
  leave: (groupId: string) =>
    axiosClient.post<{ ok: true }>(API_ENDPOINTS.groupLeave(groupId)).then((res) => res.data),
  decide: ({ groupId, userId, status }: { groupId: string; userId: string; status: "accepted" | "rejected" }) =>
    axiosClient
      .patch<{ ok: true }>(API_ENDPOINTS.groupMember(groupId, userId), { status })
      .then((res) => res.data),
  removeMember: ({ groupId, userId }: { groupId: string; userId: string }) =>
    axiosClient.delete<{ ok: true }>(API_ENDPOINTS.groupMember(groupId, userId)).then((res) => res.data),
};

export type FirebaseClientAccess = {
  uid: string;
  token: string;
  config: { apiKey: string; projectId: string; authDomain: string };
};

export const chatApi = {
  ask: (input: { sessionId?: string; message: string }) =>
    axiosClient.post<ChatResponse>(API_ENDPOINTS.chat, input).then((res) => res.data),
  deleteSession: (id: string) =>
    axiosClient.delete<{ ok: true }>(API_ENDPOINTS.chatSession(id)).then((res) => res.data),
  firebaseAccess: () =>
    axiosClient.get<FirebaseClientAccess>(API_ENDPOINTS.firebaseToken).then((res) => res.data),
};

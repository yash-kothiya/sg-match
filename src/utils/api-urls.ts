import { API_ENDPOINTS } from "@/config/constants";
import type { AuthUser, SignInInput, SignUpRequest } from "@/schemas/auth";
import type { OnboardingInput, Profile, ProfileInput, SkillOption } from "@/schemas/profile";
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

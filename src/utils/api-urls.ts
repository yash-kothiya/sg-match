import { API_ENDPOINTS } from "@/config/constants";
import type { AuthUser, SignInInput, SignUpRequest } from "@/schemas/auth";
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

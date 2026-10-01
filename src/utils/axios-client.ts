import axios, { isAxiosError, isCancel } from "axios";
import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  DEFAULT_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from "@/config/constants";
import { ApiClientError } from "./api-error";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isCancel(error)) return Promise.reject(error);

    if (isAxiosError(error)) {
      if (error.response) {
        const apiError = (error.response.data as { error?: { message?: string; fieldErrors?: Record<string, string> } } | undefined)?.error;
        return Promise.reject(
          new ApiClientError(error.response.status, apiError?.message ?? DEFAULT_ERROR_MESSAGE, apiError?.fieldErrors),
        );
      }
      if (error.code === "ECONNABORTED") {
        return Promise.reject(new ApiClientError(0, TIMEOUT_ERROR_MESSAGE));
      }
      return Promise.reject(
        new ApiClientError(0, NETWORK_ERROR_MESSAGE),
      );
    }

    return Promise.reject(error);
  },
);

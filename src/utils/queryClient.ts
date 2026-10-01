import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_MAX_RETRIES, QUERY_STALE_TIME_MS } from "@/config/constants";
import { ApiClientError } from "@/utils";

declare module "@tanstack/react-query" {
  interface Register {
    // Set `meta: { silent: true }` on a query/mutation to skip the automatic error toast.
    queryMeta: { silent?: boolean };
    mutationMeta: { silent?: boolean };
  }
}

const isClientError = (error: unknown) =>
  error instanceof ApiClientError && error.status >= 400 && error.status < 500;

function showError(error: Error) {
  toast.error(error.message || "Something went wrong. Please try again.");
}

export const queryClient = new QueryClient({
  // Every API failure surfaces as a toast. Field-level problems are additionally
  // shown inline by the form hooks.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!mutation.meta?.silent) showError(error);
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      // A 401 just means "signed out"; pages handle that themselves.
      if (query.meta?.silent || (error instanceof ApiClientError && error.status === 401)) return;
      showError(error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (count, error) => !isClientError(error) && count < QUERY_MAX_RETRIES,
      refetchOnWindowFocus: false,
      staleTime: QUERY_STALE_TIME_MS,
    },
  },
});

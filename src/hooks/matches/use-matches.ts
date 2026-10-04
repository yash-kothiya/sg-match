"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestSummary } from "@/schemas/matching";
import { MAX_MATCH_LIMIT } from "@/config/constants";
import { groupsApi, matchesApi, queryKeys } from "@/utils";

/** The user's study requests plus the shared sample requests. The server page passes them in. */
export function useRequests(initialData: RequestSummary[]) {
  return useQuery({
    queryKey: queryKeys.requests,
    queryFn: ({ signal }) => matchesApi.requests(signal),
    initialData,
    meta: { silent: true }, // the page shows its own inline error
  });
}

/** Ranked groups for one request. Switching requests keeps the previous results visible while loading. */
export function useMatches(requestId: string | null) {
  return useQuery({
    queryKey: queryKeys.matches(requestId ?? ""),
    queryFn: ({ signal }) => matchesApi.forRequest(requestId!, MAX_MATCH_LIMIT, signal),
    enabled: Boolean(requestId),
    meta: { silent: true },
  });
}

/** Creates a study request. The caller selects it afterwards using the returned id. */
export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: matchesApi.createRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.requests }),
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: matchesApi.deleteRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.requests }),
  });
}

/** Ask to join a group, or withdraw that ask. Results carry the join status, so refetch them. */
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.matchesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
    ]);
  return {
    join: useMutation({ mutationFn: groupsApi.join, onSuccess: refresh }),
    cancel: useMutation({ mutationFn: groupsApi.cancelJoin, onSuccess: refresh }),
  };
}

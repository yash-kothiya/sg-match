"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GroupDetail } from "@/schemas/groups";
import { groupsApi, queryKeys } from "@/utils";

/** Every group, with the signed-in user's status on each. Tabs, search and filters work on this list. */
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groupList,
    queryFn: ({ signal }) => groupsApi.list(signal),
    meta: { silent: true }, // the page shows its own inline error
  });
}

/** One group. The server page passes the first copy in, so there's no loading flash. */
export function useGroup(id: string, initialData: GroupDetail) {
  return useQuery({
    queryKey: queryKeys.group(id),
    queryFn: ({ signal }) => groupsApi.get(id, signal),
    initialData,
    meta: { silent: true },
  });
}

/** All group mutations refresh every group query, and the matches (which carry join status). */
function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
      queryClient.invalidateQueries({ queryKey: queryKeys.matchesAll }),
    ]);
}

export function useCreateGroup() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: groupsApi.create, onSuccess: refresh });
}

export function useUpdateGroup() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: groupsApi.update, onSuccess: refresh });
}

export function useDeleteGroup() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: groupsApi.remove, onSuccess: refresh });
}

export function useGroupActions() {
  const refresh = useRefresh();
  return {
    join: useMutation({ mutationFn: groupsApi.join, onSuccess: refresh }),
    cancel: useMutation({ mutationFn: groupsApi.cancelJoin, onSuccess: refresh }),
    leave: useMutation({ mutationFn: groupsApi.leave, onSuccess: refresh }),
    decide: useMutation({ mutationFn: groupsApi.decide, onSuccess: refresh }),
    removeMember: useMutation({ mutationFn: groupsApi.removeMember, onSuccess: refresh }),
  };
}

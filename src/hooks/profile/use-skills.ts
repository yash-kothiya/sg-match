"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, skillsApi } from "@/utils";

/** The skill catalog. It rarely changes, so keep it for the whole session. */
export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: ({ signal }) => skillsApi.list(signal),
    staleTime: Infinity,
    meta: { silent: true },
  });
}

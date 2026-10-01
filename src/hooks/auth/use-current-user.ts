"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi, queryKeys } from "@/utils";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: ({ signal }) => authApi.me(signal).then((res) => res.user),
  });
}

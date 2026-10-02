export const queryKeys = {
  skills: ["skills"] as const,
  profile: ["profile"] as const,
  requests: ["requests"] as const,
  matchesAll: ["matches"] as const,
  matches: (requestId: string) => ["matches", requestId] as const,
  auth: {
    me: ["auth", "me"] as const,
  },
};

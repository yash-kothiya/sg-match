export const queryKeys = {
  skills: ["skills"] as const,
  profile: ["profile"] as const,
  requests: ["requests"] as const,
  firebaseClient: ["firebase-client"] as const,
  groups: ["groups"] as const,
  groupList: ["groups", "list"] as const,
  group: (id: string) => ["groups", "detail", id] as const,
  matchesAll: ["matches"] as const,
  matches: (requestId: string) => ["matches", requestId] as const,
  auth: {
    me: ["auth", "me"] as const,
  },
};

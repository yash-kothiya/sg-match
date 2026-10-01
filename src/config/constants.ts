/** App-wide constants. No secrets here (see env.ts), and safe to import from client or server. */

export const APP_NAME = "SG Match";

export const ROUTES = {
  home: "/",
  auth: "/auth",
  signIn: "/auth?mode=sign-in",
  signUp: "/auth?mode=sign-up",
  onboarding: "/onboarding",
  profile: "/profile",
} as const;

// Sidebar navigation. `href: null` marks a feature that isn't built yet (shown disabled).
export const APP_NAV = [
  { key: "dashboard", title: "Dashboard", href: ROUTES.home },
  { key: "matches", title: "Matches", href: null },
  { key: "groups", title: "Study groups", href: null },
  { key: "guide", title: "Study guide", href: null },
] as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
export const API_TIMEOUT_MS = 30_000;

export const API_ENDPOINTS = {
  auth: {
    me: "/auth/me",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    signOut: "/auth/sign-out",
  },
  profile: {
    me: "/profile",
    onboarding: "/profile/onboarding",
  },
  skills: "/skills",
} as const;

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE = "Network error. Check your connection and try again.";
export const TIMEOUT_ERROR_MESSAGE = "The request timed out. Please try again.";

export const QUERY_STALE_TIME_MS = 60_000;
export const QUERY_MAX_RETRIES = 2;


export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export const SIGN_IN_SERVER_FIELDS = ["email", "password"] as const;
export const SIGN_UP_SERVER_FIELDS = ["name", "email", "password"] as const;

export const IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1";

export const FIREBASE_AUTH_ERRORS: Record<
  string,
  { status: number; message: string; field?: string }
> = {
  EMAIL_EXISTS: {
    status: 409,
    message: "An account with this email already exists",
    field: "email",
  },
  INVALID_LOGIN_CREDENTIALS: { status: 401, message: "Incorrect email or password" },
  INVALID_PASSWORD: { status: 401, message: "Incorrect email or password" },
  EMAIL_NOT_FOUND: { status: 401, message: "Incorrect email or password" },
  USER_DISABLED: { status: 403, message: "This account has been disabled" },
  TOO_MANY_ATTEMPTS_TRY_LATER: {
    status: 429,
    message: "Too many attempts. Please try again later",
  },
  WEAK_PASSWORD: {
    status: 400,
    message: "Password is too weak",
    field: "password",
  },
};

// Onboarding wizard

// Keep these values in sync with the pg enums in src/db/schema/enums (that module can't be
// imported client-side).
export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", description: "Just getting started with the subject" },
  { value: "intermediate", label: "Intermediate", description: "Comfortable with the basics" },
  { value: "advanced", label: "Advanced", description: "Strong grasp, happy to help others" },
] as const;

export const STUDY_MODES = [
  { value: "online", label: "Online", description: "Video calls and shared docs" },
  { value: "in_person", label: "In person", description: "Meet on campus or nearby" },
  { value: "hybrid", label: "Hybrid", description: "A mix of both" },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "weekday_morning", label: "Weekday mornings" },
  { value: "weekday_afternoon", label: "Weekday afternoons" },
  { value: "weekday_evening", label: "Weekday evenings" },
  { value: "weekend_morning", label: "Weekend mornings" },
  { value: "weekend_afternoon", label: "Weekend afternoons" },
  { value: "weekend_evening", label: "Weekend evenings" },
] as const;

export const INTEREST_SUGGESTIONS = [
  "Algorithms",
  "Web development",
  "Data science",
  "Machine learning",
  "Databases",
  "Mathematics",
  "Statistics",
  "Cybersecurity",
] as const;

export const ONBOARDING_STEPS = [
  { title: "About you", description: "Where you study and a line about yourself." },
  { title: "How you study", description: "Your level and how you like to meet." },
  { title: "Your skills", description: "What you already know. More skills mean better matches." },
  { title: "Time and topics", description: "When you're free and what you want to learn." },
] as const;

export const BIO_MAX_LENGTH = 280;
export const MAX_INTERESTS = 10;
export const MAX_SKILLS = 15;

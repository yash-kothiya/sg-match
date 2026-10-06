import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"));

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: emailField,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
    // By default zod skips object-level checks while any field is invalid, which would
    // hide this message. Run it whenever both fields have a value.
    when: ({ value }) => {
      const v = value as { password?: unknown; confirmPassword?: unknown };
      return typeof v.password === "string" && typeof v.confirmPassword === "string" && v.confirmPassword.length > 0;
    },
  });

// The API only needs the fields below; confirmPassword is a client-side check.
export const signUpRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailField,
  password: z.string().min(8).max(128),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  onboarded: boolean;
  /** Firestore paths and rules are keyed by this, not by `id`. Not secret (the browser signs in to Firebase with it). */
  firebaseUid: string;
};

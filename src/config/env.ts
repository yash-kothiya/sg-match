import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() ? value : undefined;
}

export const env = {
  DATABASE_URL: requiredEnv("DATABASE_URL"),
  FIREBASE_PROJECT_ID: optionalEnv("FIREBASE_PROJECT_ID"),
  FIREBASE_CLIENT_EMAIL: optionalEnv("FIREBASE_CLIENT_EMAIL"),
  FIREBASE_PRIVATE_KEY: optionalEnv("FIREBASE_PRIVATE_KEY"),
  FIREBASE_WEB_API_KEY: optionalEnv("FIREBASE_WEB_API_KEY"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

/** For optional vars that a feature needs at call time; throws a clear error if unset. */
export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value as NonNullable<(typeof env)[K]>;
}

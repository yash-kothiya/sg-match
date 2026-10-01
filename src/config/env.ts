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
  // FIREBASE_PROJECT_ID: requiredEnv("FIREBASE_PROJECT_ID"),
  // FIREBASE_CLIENT_EMAIL: requiredEnv("FIREBASE_CLIENT_EMAIL"),
  // FIREBASE_PRIVATE_KEY: requiredEnv("FIREBASE_PRIVATE_KEY"),
  // FIREBASE_WEB_API_KEY: requiredEnv("FIREBASE_WEB_API_KEY"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
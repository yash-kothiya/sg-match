import "server-only";

import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
    /** Machine-readable reason, e.g. "RATE_LIMITED". Lets the UI choose its own wording. */
    public code?: string,
  ) {
    super(message);
  }
}

export type ApiErrorBody = {
  error: { message: string; fieldErrors?: Record<string, string>; code?: string };
};

/** Wraps a route handler so thrown errors become consistent JSON responses. */
export function handleRoute<Ctx = unknown>(
  handler: (request: Request, ctx: Ctx) => Promise<Response>,
): (request: Request, ctx: Ctx) => Promise<Response> {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.status, error.message, error.fieldErrors, error.code);
      }
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const key = issue.path.join(".");
          if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        return errorResponse(400, "Invalid request", fieldErrors);
      }
      console.error("Unhandled API error:", error);
      return errorResponse(500, "Something went wrong. Please try again.");
    }
  };
}

function errorResponse(
  status: number,
  message: string,
  fieldErrors?: Record<string, string>,
  code?: string,
) {
  const body: ApiErrorBody = { error: { message, fieldErrors, code } };
  return Response.json(body, { status });
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}

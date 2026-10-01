import "server-only";

import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export type ApiErrorBody = {
  error: { message: string; fieldErrors?: Record<string, string> };
};

/** Wraps a route handler so thrown errors become consistent JSON responses. */
export function handleRoute(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.status, error.message, error.fieldErrors);
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
) {
  const body: ApiErrorBody = { error: { message, fieldErrors } };
  return Response.json(body, { status });
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}

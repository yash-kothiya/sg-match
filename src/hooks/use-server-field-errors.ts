"use client";

import { useCallback } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiClientError } from "@/utils";

export function useServerFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fields: readonly Path<T>[],
) {
  const { setError } = form;

  return useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiClientError) || !error.fieldErrors) return;

      for (const field of fields) {
        const message = error.fieldErrors[field];
        if (message) setError(field, { message });
      }
    },
    [setError, fields],
  );
}

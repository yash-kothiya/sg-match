import type { ComponentProps } from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type FormFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: FieldError;
};

export function FormField({ label, error, id, type, ...inputProps }: FormFieldProps) {
  const inputId = id ?? inputProps.name;
  const errorId = `${inputId}-error`;
  const Control = type === "password" ? PasswordInput : Input;
  const controlProps = type === "password" ? inputProps : { ...inputProps, type };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Control
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...controlProps}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

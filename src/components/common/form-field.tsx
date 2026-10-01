import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

/** Label, control slot, optional hint and inline error. Use for any non-text control. */
export function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: { message?: string };
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

type FormFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: { message?: string };
  hint?: string;
};

export function FormField({ label, error, hint, id, type, ...inputProps }: FormFieldProps) {
  const inputId = id ?? inputProps.name;
  const Control = type === "password" ? PasswordInput : Input;
  const controlProps = type === "password" ? inputProps : { ...inputProps, type };

  return (
    <FieldShell label={label} htmlFor={inputId} error={error} hint={hint}>
      <Control
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...controlProps}
      />
    </FieldShell>
  );
}

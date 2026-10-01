"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { authApi, queryKeys } from "@/utils";
import { ROUTES, SIGN_IN_SERVER_FIELDS, SIGN_UP_SERVER_FIELDS } from "@/config/constants";
import { useServerFieldErrors } from "@/hooks/use-server-field-errors";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/schemas/auth";

/* ---------- Mutations ---------- */

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

/* ---------- Forms (React Hook Form + zod + mutation) ---------- */

export function useSignInForm() {
  const router = useRouter();
  const signIn = useSignIn();

  const form = useForm<SignInInput>({
    mode: "onTouched",
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const applyServerErrors = useServerFieldErrors(form, SIGN_IN_SERVER_FIELDS);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
      router.replace(ROUTES.home);
      router.refresh();
    } catch (error) {
      applyServerErrors(error);
    }
  });

  return { form, onSubmit, isPending: signIn.isPending };
}

export function useSignUpForm() {
  const router = useRouter();
  const signUp = useSignUp();

  const form = useForm<SignUpInput>({
    mode: "onTouched",
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const applyServerErrors = useServerFieldErrors(form, SIGN_UP_SERVER_FIELDS);

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    try {
      await signUp.mutateAsync({ name, email, password });
      router.replace(ROUTES.home);
      router.refresh();
    } catch (error) {
      applyServerErrors(error);
    }
  });

  return { form, onSubmit, isPending: signUp.isPending };
}

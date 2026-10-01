"use client";

import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { FormField } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSignUpForm } from "@/hooks/auth";

export function SignUp() {
  const {
    form: {
      register,
      formState: { errors },
    },
    onSubmit,
    isPending,
  } = useSignUpForm();

  return (
    <Card className="w-full max-w-md shadow-lg shadow-primary/5">
      <CardHeader className="gap-4">
        <Tabs value="sign-up">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in" asChild>
              <Link href={ROUTES.signIn}>Sign in</Link>
            </TabsTrigger>
            <TabsTrigger value="sign-up" asChild>
              <Link href={ROUTES.signUp}>Sign up</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Tell us who you are and we&apos;ll start matching.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Name" autoComplete="name" error={errors.name} {...register("name")} />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email}
            {...register("email")}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            {...register("password", { deps: ["confirmPassword"] })}
          />
          <FormField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <SubmitButton isPending={isPending} pendingLabel="Creating account…">
            Create account
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

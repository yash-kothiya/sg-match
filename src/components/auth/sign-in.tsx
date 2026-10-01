"use client";

import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { FormField } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSignInForm } from "@/hooks/auth";

export function SignIn() {
  const {
    form: {
      register,
      formState: { errors },
    },
    onSubmit,
    isPending,
  } = useSignInForm();

  return (
    <Card className="w-full max-w-md shadow-lg shadow-primary/5">
      <CardHeader className="gap-4">
        <Tabs value="sign-in">
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
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to see your study group matches.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
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
            autoComplete="current-password"
            error={errors.password}
            {...register("password")}
          />
          <SubmitButton isPending={isPending} pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

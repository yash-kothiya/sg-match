import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Dashboard · SG Match" };

export default async function DashboardPage() {
  // The (app) layout already guarantees a user; this call is memoized per request.
  const user = (await getSessionUser())!;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold sm:text-4xl">Hi, {user.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Here&apos;s where your study group matches will live.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Your matches</CardTitle>
            <CardDescription>Ranked by how well they fit your request.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <SparklesIcon className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-medium">No matches yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Once you post a study request, the groups that fit it best will show up here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Details from your sign-up.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

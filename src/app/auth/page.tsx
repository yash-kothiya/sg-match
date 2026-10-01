import { redirect } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { SignIn } from "@/components/auth/sign-in";
import { SignUp } from "@/components/auth/sign-up";
import { Brand } from "@/components/common/brand";
import { getSessionUser } from "@/services/auth.service";

export const metadata = { title: "Sign in · SG Match" };

const POINTS = [
  "Post what you're studying and when you're free.",
  "Get ranked group matches with the reasons behind each one.",
  "Ask the study guide anything and see where the answer came from.",
];

export default async function AuthPage(props: PageProps<"/auth">) {
  if (await getSessionUser()) redirect(ROUTES.home);

  const { mode } = await props.searchParams;

  return (
    <main className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-linear-to-br from-sidebar via-sidebar to-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Overlapping circles echo the brand mark: people converging into a group. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 size-96 rounded-full bg-white/10" />
          <div className="absolute top-40 -right-40 size-96 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-black/10" />
        </div>

        <Brand inverted className="relative text-primary-foreground" />

        <div className="relative max-w-md">
          <h1 className="font-heading text-5xl leading-[1.05] font-semibold">
            Find people who study the way you do.
          </h1>
          <ul className="mt-8 flex flex-col gap-4 text-primary-foreground/85">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-foreground" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/70">Study group matching</p>
      </section>

      <section className="flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-8">
        <Brand className="lg:hidden" />
        {mode === "sign-up" ? <SignUp /> : <SignIn />}
      </section>
    </main>
  );
}

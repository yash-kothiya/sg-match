import Link from "next/link";
import { APP_NAME, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

/** Two overlapping circles: a study group in its simplest form. */
export function BrandMark({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-9 w-9 items-center", className)} aria-hidden>
      <span
        className={cn("absolute left-0 size-6 rounded-full", inverted ? "bg-primary-foreground" : "bg-primary")}
      />
      <span
        className={cn(
          "absolute right-0 size-6 rounded-full",
          inverted ? "bg-primary-foreground/50" : "bg-primary/40 mix-blend-multiply",
        )}
      />
    </span>
  );
}

export function Brand({
  href = ROUTES.home,
  inverted,
  className,
}: {
  href?: string;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark inverted={inverted} />
      <span className="font-heading text-xl font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}

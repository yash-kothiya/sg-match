import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  isPending,
  pendingLabel,
  className,
  children,
}: {
  isPending: boolean;
  pendingLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button type="submit" size="lg" disabled={isPending} className={cn("w-full", className)}>
      {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
      {isPending ? pendingLabel : children}
    </Button>
  );
}

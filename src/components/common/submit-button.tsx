import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  isPending,
  pendingLabel,
  children,
}: {
  isPending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Button type="submit" size="lg" disabled={isPending} className="w-full">
      {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
      {isPending ? pendingLabel : children}
    </Button>
  );
}

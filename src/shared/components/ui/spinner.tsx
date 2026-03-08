import { cn } from "@/shared/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary",
        className
      )}
    />
  );
}

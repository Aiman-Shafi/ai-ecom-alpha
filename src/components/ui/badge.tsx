import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        {
          "bg-primary/10 text-primary": variant === "default",
          "border border-border text-muted-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

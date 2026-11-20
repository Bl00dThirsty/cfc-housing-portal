import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * CountBadge — kit design language
 * (`guichet-unque-cfc/components/_ui/count-badge`).
 */
export function CountBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="count-badge"
      className={cn(
        "caption-style inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border border-line-strong bg-muted px-1 text-center text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export default CountBadge;

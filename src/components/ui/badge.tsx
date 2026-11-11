import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — pill label.
 *
 * The kit has no `badge`; its pill role is covered by `tag` (tone-coloured)
 * and `count-badge` (numeric). This primitive keeps the app's exported API
 * (`Badge`, `badgeVariants`, `BadgeProps`) and every variant the app already
 * used, re-expressed with the kit's token vocabulary.
 */
const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-[12px] leading-none font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-1 focus:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3! [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline: "border-line-strong text-foreground",
        success: "border-transparent bg-success/10 text-success hover:bg-success/20",
        cfc: "border-transparent bg-cfc-lightgold text-cfc-brown border-cfc-gold/20 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

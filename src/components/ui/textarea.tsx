import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Textarea — mirrors the kit's `Input` rhythm
 * (`guichet-unque-cfc/components/_ui/input`); the kit has no textarea of its
 * own.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-line-strong bg-secondary px-3 py-2 text-[14px] leading-normal text-foreground outline-none transition-[border-color] duration-150 ease-power3-out placeholder:text-subtle focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

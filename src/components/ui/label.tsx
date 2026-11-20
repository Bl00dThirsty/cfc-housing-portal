import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Label — kit design language (`guichet-unque-cfc/components/_ui/label`).
 *
 * The kit wraps Radix's `Label` primitive; the app has no `@radix-ui/react-label`
 * dependency and cannot gain one, so the primitive is expressed directly on
 * the semantic `<label>` element (which is what Radix renders underneath).
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("caption-style select-none text-soft", className)}
      {...props}
    />
  );
}

export { Label };

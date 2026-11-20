import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Toggle — the kit has no toggle of its own; the app's primitive is kept and
 * re-skinned with the kit's token vocabulary. `toggleVariants` stays exported
 * because `toggle-group` consumes it.
 */
const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium leading-none outline-none select-none transition-colors duration-150 ease-power3-out focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-subtle hover:bg-muted hover:text-foreground data-[state=on]:bg-secondary data-[state=on]:text-foreground",
        outline:
          "border border-line-strong bg-transparent text-subtle hover:bg-muted hover:text-foreground data-[state=on]:bg-secondary data-[state=on]:text-foreground",
      },
      size: {
        default: "h-9 px-3 text-[14px]",
        sm: "h-8 px-2 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-3 text-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    data-slot="toggle"
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };

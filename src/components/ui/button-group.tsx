import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

/**
 * ButtonGroup — the kit has no button group of its own; the app's primitive
 * is kept and re-skinned with the kit's token vocabulary.
 */
const buttonGroupVariants = cva(
  "inline-flex w-fit items-stretch rounded-lg [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-line-strong",
        orientation === "vertical" ? "h-auto w-px my-px" : "h-px w-auto mx-px",
        className
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator };

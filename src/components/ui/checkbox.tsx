"use client";

import * as React from "react";
import { Square, SquareCheckBig, SquareMinus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxState = boolean | "indeterminate";

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: CheckboxState;
  onCheckedChange?: (checked: CheckboxState) => void;
}

/**
 * Checkbox — kit design language
 * (`guichet-unque-cfc/components/_ui/checkbox`).
 *
 * The kit draws three states (unchecked / checked / indeterminate) with
 * dedicated square glyphs; those are swapped for their `lucide-react`
 * equivalents. The kit relies on `@radix-ui/react-checkbox`, which the app
 * cannot depend on, so the tri-state behaviour is expressed directly while
 * keeping the app's `CheckboxState` / `CheckboxProps` API untouched.
 */
const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    const isChecked = checked === true;
    const isIndeterminate = checked === "indeterminate";
    const state = isChecked ? "checked" : isIndeterminate ? "indeterminate" : "unchecked";

    return (
      <button
        type="button"
        role="checkbox"
        data-slot="checkbox"
        data-state={state}
        aria-checked={isIndeterminate ? "mixed" : isChecked}
        disabled={disabled}
        ref={ref}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          onCheckedChange?.(isChecked ? false : true);
        }}
        className={cn(
          "group peer inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] text-subtle outline-none select-none transition-[color] duration-150 ease-power3-out hover:text-line-strong focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <Square
          aria-hidden
          className="size-4 group-data-[state=checked]:hidden group-data-[state=indeterminate]:hidden"
        />
        <SquareCheckBig
          aria-hidden
          className="hidden size-4 group-data-[state=checked]:block"
        />
        <SquareMinus
          aria-hidden
          className="hidden size-4 group-data-[state=indeterminate]:block"
        />
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

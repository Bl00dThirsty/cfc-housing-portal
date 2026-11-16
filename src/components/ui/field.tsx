import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Field — kit design language (`guichet-unque-cfc/components/_ui/field`).
 */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  trailing,
  className,
  children,
}: FieldProps) {
  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span aria-hidden className="text-subtle">
              {" "}
              *
            </span>
          )}
        </Label>
        {trailing}
      </div>
      {children}
      {error ? (
        <span
          id={`${htmlFor}-error`}
          role="alert"
          className="caption-style text-danger block"
        >
          {error}
        </span>
      ) : (
        hint && (
          <span
            id={`${htmlFor}-hint`}
            className="caption-style text-subtle block"
          >
            {hint}
          </span>
        )
      )}
    </div>
  );
}

export default Field;

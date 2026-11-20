"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative w-full">
        <Input
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          ref={ref}
          className={cn("pr-8", className)}
          {...props}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          tabIndex={-1}
          className="absolute right-1 top-1/2 size-6 -translate-y-1/2 rounded-md text-subtle hover:bg-transparent hover:text-foreground"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={
            showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {showPassword ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

type FilterMenuProps = {
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  align?: "start" | "end";
  className?: string;
};

/**
 * FilterMenu — ported from `guichet-unque-cfc/components/_common/filter-menu`.
 *
 * The kit's trigger is a split button (optional label pane + value pane) that
 * opens a radio-group dropdown. The kit's own chevron SVG is replaced by the
 * equivalent `lucide-react` icon, and its translucent-white divider is
 * expressed with the light-theme token `bg-foreground/10`.
 */
export function FilterMenu({
  label,
  value,
  options,
  onChange,
  align = "start",
  className,
}: FilterMenuProps) {
  const current = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="none"
          className={cn(
            "group h-[30px] gap-0 overflow-hidden text-[12px] data-[state=open]:bg-muted",
            className,
          )}
        >
          {label && (
            <>
              <span className="px-[9px] font-normal text-subtle">{label}</span>
              <span aria-hidden className="h-full w-px bg-foreground/10" />
            </>
          )}
          <span
            className={cn(
              "flex items-center px-[9px]",
              label ? "gap-1.5" : "gap-1",
            )}
          >
            {current?.label ?? value}
            <ChevronDown
              aria-hidden
              className="size-3 text-subtle transition-transform duration-200 ease-power3-out group-data-[state=open]:rotate-180"
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {label && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FilterMenu;

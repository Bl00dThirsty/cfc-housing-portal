"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Popover — kit design language (`guichet-unque-cfc/components/_ui/popover`).
 *
 * The kit wraps Radix's `Popover` primitive through the unified `radix-ui`
 * package. The app depends on the individual `@radix-ui/react-*` packages
 * and cannot gain `@radix-ui/react-popover` (or the unified `radix-ui`
 * package) without a `package.json` change, so the primitive is implemented
 * directly: same public surface (`Popover`, `PopoverTrigger`,
 * `PopoverContent`), same `data-slot` hooks, same visual language, plus
 * outside-pointer and Escape dismissal and viewport collision clamping.
 */

type PopoverAlign = "start" | "center" | "end";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string) {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error(`\`${component}\` must be used within \`Popover\`.`);
  }
  return context;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const value = React.useMemo(
    () => ({ open, setOpen, triggerRef }),
    [open, setOpen],
  );

  return (
    <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
  );
}

export type PopoverTriggerProps = React.ComponentProps<"button"> & {
  /**
   * Rend le déclencheur via `Slot` : le contrôleur peut être n'importe quel
   * élément (un `Button` de l'application, par exemple) sans perdre la
   * position, l'état ouvert et la gestion du clic.
   */
  asChild?: boolean;
};

export function PopoverTrigger({
  className,
  onClick,
  children,
  asChild,
  ...props
}: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopoverContext("PopoverTrigger");
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={triggerRef}
      type={asChild ? undefined : "button"}
      data-slot="popover-trigger"
      data-state={open ? "open" : "closed"}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setOpen(!open);
      }}
      {...props}
    >
      {children}
    </Comp>
  );
}

export type PopoverContentProps = React.ComponentProps<"div"> & {
  align?: PopoverAlign;
  sideOffset?: number;
  collisionPadding?: number;
};

export function PopoverContent({
  className,
  align = "end",
  sideOffset = 8,
  collisionPadding = 16,
  style,
  children,
  ...props
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = usePopoverContext("PopoverContent");
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + sideOffset;
    let left =
      align === "start"
        ? triggerRect.left
        : align === "end"
          ? triggerRect.right - contentRect.width
          : triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;

    // Flip above the trigger when there is not enough room below.
    if (
      top + contentRect.height > viewportHeight - collisionPadding &&
      triggerRect.top - sideOffset - contentRect.height > collisionPadding
    ) {
      top = triggerRect.top - sideOffset - contentRect.height;
    }

    left = Math.min(
      Math.max(left, collisionPadding),
      Math.max(
        collisionPadding,
        viewportWidth - contentRect.width - collisionPadding,
      ),
    );
    top = Math.min(
      Math.max(top, collisionPadding),
      Math.max(collisionPadding, viewportHeight - contentRect.height - collisionPadding),
    );

    setPosition({ top, left });
  }, [align, collisionPadding, sideOffset, triggerRef]);

  useIsomorphicLayoutEffect(() => {
    if (!open) return;

    updatePosition();

    const handleViewportChange = () => updatePosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        contentRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="dialog"
      data-slot="popover-content"
      data-state="open"
      className={cn(
        "border-line-strong bg-popover text-popover-foreground data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97] data-[state=closed]:ease-power3-in data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=open]:ease-power3-out z-50 overflow-hidden rounded-xl border shadow-overlay duration-200 outline-none data-[state=closed]:duration-150",
        className,
      )}
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}

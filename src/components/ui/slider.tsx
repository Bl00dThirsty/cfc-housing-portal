"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * Slider — kit design language (`guichet-unque-cfc/components/_ui/slider`).
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    data-slot="slider"
    className={cn(
      "relative flex h-5 w-full touch-none items-center select-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="bg-track relative h-1.5 grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-soft absolute h-full rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={props["aria-label"]}
      className="bg-foreground ease-power3-out block size-4 cursor-grab rounded-full shadow-[0px_2px_6px_0px_rgba(0,0,0,0.5),0px_0px_0px_1px_rgba(0,0,0,0.4)] transition-[box-shadow] duration-150 outline-none focus-visible:shadow-[0px_2px_6px_0px_rgba(0,0,0,0.5),0px_0px_0px_4px_rgba(255,255,255,0.12)] active:cursor-grabbing"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

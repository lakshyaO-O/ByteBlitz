"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-[60] w-72 rounded-2xl border border-white/10 bg-popover/90 p-4 text-popover-foreground shadow-[0_16px_50px_rgb(0,0,0,0.4)] outline-none backdrop-blur-2xl will-change-transform transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] origin-[var(--radix-popover-content-transform-origin)] data-[state=closed]:opacity-0 data-[state=closed]:scale-90 data-[state=open]:opacity-100 data-[state=open]:scale-100",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }

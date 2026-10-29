"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[60] max-w-xs rounded-xl border border-white/10 bg-popover/90 px-3.5 py-2 text-xs font-medium text-popover-foreground shadow-[0_8px_30px_rgb(0,0,0,0.35)] outline-none backdrop-blur-xl will-change-transform transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] origin-[var(--radix-tooltip-content-transform-origin)] data-[state=closed]:opacity-0 data-[state=closed]:scale-90 data-[state=open]:opacity-100 data-[state=open]:scale-100",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/12 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/12 text-destructive",
        outline:
          "text-foreground border-border/70 bg-background",
        success:
          "border-transparent bg-emerald-500/12 text-emerald-400",
        warning:
          "border-transparent bg-yellow-500/12 text-yellow-400",
        info:
          "border-transparent bg-blue-500/12 text-blue-400",
        premium:
          "border-transparent bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-400 border-amber-500/20",
        easy:
          "border-transparent bg-emerald-500/12 text-emerald-400",
        medium:
          "border-transparent bg-yellow-500/12 text-yellow-400",
        hard:
          "border-transparent bg-destructive/12 text-destructive",
        verified:
          "border-transparent bg-sky-500/12 text-sky-400",
        admin:
          "border-transparent bg-purple-500/12 text-purple-400",
        online:
          "border-transparent bg-emerald-500/12 text-emerald-400",
        offline:
          "border-transparent bg-muted/80 text-muted-foreground",
        ai:
          "border-transparent bg-gradient-to-r from-primary/15 to-purple-500/15 text-primary border-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

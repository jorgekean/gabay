import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | '4Ps' | 'SPED' | 'high-risk'
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80": variant === "secondary",
          "text-foreground": variant === "outline",
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300": variant === "4Ps",
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300": variant === "SPED",
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300": variant === "high-risk",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

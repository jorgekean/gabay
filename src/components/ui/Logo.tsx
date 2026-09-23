import * as React from "react"
import { cn } from "../../lib/utils"

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-7", className)}
      {...props}
    >
      {/* Analytics Bars */}
      <rect x="3" y="12" width="4" height="9" rx="1" className="fill-primary/50 dark:fill-primary/60" />
      <rect x="10" y="7" width="4" height="14" rx="1" className="fill-primary" />
      <rect x="17" y="14" width="4" height="7" rx="1" className="fill-primary/30 dark:fill-primary/40" />
      
      {/* School / Protection Roof */}
      <path 
        d="M1.5 10.5L12 2.5L22.5 10.5" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-primary" 
      />
    </svg>
  )
}

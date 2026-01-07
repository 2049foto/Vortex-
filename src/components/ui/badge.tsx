import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "premium" | "glass"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/25",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    outline: "text-foreground border-border",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/10",
    warning: "border-amber-200 bg-amber-50 text-amber-700 shadow-sm shadow-amber-500/10",
    premium: "border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25",
    glass: "border-white/20 bg-white/20 backdrop-blur-md text-foreground shadow-sm"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    variant?: 'default' | 'glass' | 'neo' | 'gradient' | 'mesh' | 'premium';
    hover?: boolean;
  }
>(({ className, variant = 'default', hover = false, ...props }, ref) => {
  
  const variants = {
    default: "bg-white text-card-foreground border border-slate-100 shadow-sm",
    glass: "bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-slate-200/40",
    neo: "bg-white border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
    gradient: "bg-gradient-to-br from-white to-slate-50 border border-white/50",
    mesh: "bg-white/80 backdrop-blur-md border border-white/50 relative overflow-hidden",
    premium: "bg-gradient-to-b from-white to-slate-50 border border-white/50 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl transition-all duration-300",
        variants[variant],
        hover && "hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/10",
        className
      )}
      {...props}
    >
      {variant === 'mesh' && (
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full translate-x-1/3 -translate-y-1/3" />
      )}
      {props.children}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-8", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight font-display text-slate-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-base text-muted-foreground leading-relaxed font-light", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-8 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-8 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

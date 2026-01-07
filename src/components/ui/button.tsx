import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glass' | 'iridescent' | 'soft' | 'neo' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'xl';
  isLoading?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, glow, children, ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] overflow-hidden";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 border border-transparent",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
      outline: "border-2 border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25",
      glass: "bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 shadow-sm hover:shadow-md",
      iridescent: "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white border-none hover:opacity-90 shadow-lg shadow-indigo-500/25",
      soft: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
      neo: "bg-white text-foreground border border-slate-200 shadow-[0_4px_0_0_rgb(203,213,225)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_rgb(203,213,225)] active:translate-y-[4px] active:shadow-none transition-all duration-100",
      premium: "bg-slate-900 text-white border border-slate-800 shadow-xl shadow-slate-900/20 hover:bg-slate-800"
    };

    const sizes = {
      sm: "h-9 rounded-lg px-3 text-xs",
      md: "h-11 px-6 py-2",
      lg: "h-14 rounded-2xl px-8 text-base font-semibold",
      xl: "h-16 rounded-2xl px-10 text-lg font-bold tracking-tight",
      icon: "h-11 w-11"
    };

    // Exclude animation-related props that conflict with framer-motion
    const {
      onDrag,
      onDragStart,
      onDragEnd,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...restProps
    } = props;
    
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...(restProps as any)}
      >
        {/* Glow Effect */}
        {glow && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
        )}
        
        {/* Shine Effect for Iridescent */}
        {variant === 'iridescent' && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
        )}

        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        <span className="relative z-20 flex items-center gap-2">{children}</span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }

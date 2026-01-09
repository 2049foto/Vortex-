/**
 * Vortex Protocol - Premium Button Component
 * 2026 Design: 2.5D, Gradient borders, Micro-interactions
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glass' | 'iridescent' | 'soft' | 'neo' | 'premium' | 'gradient' | 'glow3d';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'xl';
  isLoading?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, glow, children, ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 border border-transparent active:scale-[0.98]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent active:scale-[0.98]",
      outline: "border-2 border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent active:scale-[0.98]",
      ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25 active:scale-[0.98]",
      glass: "bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 shadow-sm hover:shadow-md active:scale-[0.98]",
      iridescent: "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white border-none hover:opacity-90 shadow-lg shadow-indigo-500/25 active:scale-[0.98]",
      soft: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 active:scale-[0.98]",
      // 2.5D Neo Button - New 2026 Style
      neo: "bg-white text-foreground border border-slate-200 shadow-[0_4px_0_0_rgb(203,213,225)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_rgb(203,213,225)] active:translate-y-[4px] active:shadow-none transition-all duration-100",
      premium: "bg-slate-900 text-white border border-slate-800 shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98]",
      // Gradient Border Button - 2026 Trend
      gradient: "bg-white text-slate-900 border-0 before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500 before:-z-10 before:content-[''] hover:before:from-indigo-600 hover:before:via-purple-600 hover:before:to-pink-600 active:scale-[0.98]",
      // 3D Glow Button - Premium 2026
      glow3d: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_0_0_rgba(79,70,229,0.6),0_8px_20px_-4px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_0_0_rgba(79,70,229,0.6),0_12px_28px_-4px_rgba(99,102,241,0.5)] hover:-translate-y-[2px] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(79,70,229,0.6),0_4px_12px_-4px_rgba(99,102,241,0.3)] transition-all duration-150"
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
        whileTap={variant === 'neo' || variant === 'glow3d' ? undefined : { scale: 0.97 }}
        whileHover={variant === 'glow3d' ? { y: -2 } : undefined}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...(restProps as any)}
      >
        {/* Glow Effect */}
        {glow && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
        )}
        
        {/* Shine Effect for Iridescent & Glow3D */}
        {(variant === 'iridescent' || variant === 'glow3d') && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent z-10 pointer-events-none"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}

        {/* Top highlight for 3D effect */}
        {variant === 'glow3d' && (
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        )}

        {isLoading ? (
          <motion.div 
            className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}
        <span className="relative z-20 flex items-center gap-2">{children}</span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }

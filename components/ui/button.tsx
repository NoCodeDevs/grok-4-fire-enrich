import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        code: "h-9 px-4 rounded-[10px] text-sm font-medium items-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-800 disabled:hover:bg-slate-800 [box-shadow:0_2px_8px_rgba(0,0,0,0.3)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:0_1px_4px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:0_1px_2px_rgba(0,0,0,0.5)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        orange: "h-9 px-4 rounded-[10px] text-sm font-medium items-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-400 hover:to-purple-500 [box-shadow:0_2px_8px_rgba(236,72,153,0.3)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:0_1px_4px_rgba(236,72,153,0.4)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:0_1px_2px_rgba(236,72,153,0.5)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

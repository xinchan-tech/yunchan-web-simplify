import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader } from 'lucide-react'
import { cn } from "@/utils/style"

const buttonVariants = cva(
  "inline-flex border items-center justify-center gap-2 border-solid cursor-pointer whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-none hover:bg-primary/90 ",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-input bg-transparent text-foreground hover:bg-accent hover:text-foreground hover:border-input",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "bg-transparent !p-0 m-0 border-0 !h-auto w-auto"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        mini: "h-6 px-2 rounded-sm text-xs",
      },
      loading: {
        'true': "pointer-events-none cursor-wait opacity-85"
      },
      block: {
        'true': "w-full"
      },
      reset: {
        'true': "bg-transparent border-none text-inherit hover:bg-transparent p-0 focus-visible:ring-0"
      }
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
  ({ className, variant, size, asChild = false, loading, children, block, reset, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, block, reset, className }))}
        ref={ref}
        {...props}
      >
        {
          loading && <Loader className="animate-spin" />
        }
        {
          children
        }
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

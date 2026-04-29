"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono text-xs uppercase tracking-widest transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:opacity-90 active:opacity-100",
        outline:
          "border border-[color:var(--color-ink)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]",
        ghost: "text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]",
        oxblood: "bg-[color:var(--color-oxblood)] text-[color:var(--color-paper)] hover:opacity-90",
        link: "text-[color:var(--color-ink)] underline underline-offset-4 hover:opacity-80",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

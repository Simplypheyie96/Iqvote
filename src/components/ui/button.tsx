import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

// Elevation carries the affordance: a button that can be pressed sits above the
// page, lifts a little on hover, and settles back down when held. Flat variants
// (ghost, link) stay flat on purpose — they aren't objects, they're text.
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] active:duration-75 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-e1 hover:bg-primary/90 hover:shadow-e2 active:shadow-e1",
        destructive:"bg-destructive text-white shadow-e1 hover:bg-destructive/90 hover:shadow-e2 active:shadow-e1 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:"border border-border bg-card text-foreground shadow-e1 hover:bg-accent hover:text-accent-foreground hover:shadow-e2 active:shadow-e1",
        secondary:"bg-secondary text-secondary-foreground shadow-e1 hover:bg-secondary/80 hover:shadow-e2 active:shadow-e1",
        ghost:"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm:"h-8 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg:"h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon:"size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
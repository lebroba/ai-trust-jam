import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-ink/20 bg-white px-3 text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:ring-2 focus:ring-gold/50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

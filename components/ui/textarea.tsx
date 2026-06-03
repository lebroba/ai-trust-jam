import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y rounded-md border border-ink/20 bg-white px-3 py-2 text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:ring-2 focus:ring-gold/50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

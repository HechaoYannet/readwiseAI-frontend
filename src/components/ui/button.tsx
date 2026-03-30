import * as React from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const baseStyles =
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-sky-500 text-white hover:bg-sky-600",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 px-6 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };


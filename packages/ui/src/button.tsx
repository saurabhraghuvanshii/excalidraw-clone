import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "lg" | "sm" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "lg", children, ...props }, ref) => {
    // Base styles that apply to all buttons
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";

    // Variant styles
    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
      secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg",
      outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md",
    };

    // Size styles
    const sizeStyles = {
      lg: "h-11 px-8 py-2 rounded-full text-sm", // Made fully rounded
      sm: "h-9 px-4 rounded-full text-xs", // Made fully rounded
      icon: "h-10 w-10 rounded-full", // Made fully rounded
    };

    // Combine the styles
    const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out`;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// A helper function to combine class names
export function buttonVariants({
  variant = "primary",
  size = "lg",
  className = ""
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  // Base styles that apply to all buttons
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";

  // Variant styles
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
    secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md",
  };

  // Size styles
  const sizeStyles = {
    lg: "h-11 px-8 py-2 rounded-full text-sm",
    sm: "h-9 px-4 rounded-full text-xs",
    icon: "h-10 w-10 rounded-full",
  };

  // Combine the styles
  return `${baseStyles} ${variant ? variantStyles[variant] : ''} ${size ? sizeStyles[size] : ''} ${className}`;
}

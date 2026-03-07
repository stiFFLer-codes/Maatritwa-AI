import { forwardRef } from "react";
import { motion } from "framer-motion";

const buttonVariants = (variant, size) => {
  const base = "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-secondary text-white hover:bg-secondary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.default}`;
};

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <motion.button
      className={`${buttonVariants(variant, size)} ${className || ''}`}
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    />
  );
});

Button.displayName = "Button";

export default Button;
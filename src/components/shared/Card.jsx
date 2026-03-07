import { forwardRef } from "react";
import { motion } from "framer-motion";

const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
}

const Card = forwardRef(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      "rounded-2xl bg-surface text-on-surface shadow-soft",
      className
    )}
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };
export default Card;


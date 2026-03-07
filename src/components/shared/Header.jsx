import { LogIn } from "lucide-react";
import Button from "./Button";
import { motion } from "framer-motion";

function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 50 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20 border-b border-on-surface/10">
          <div className="text-2xl font-serif font-bold text-primary">
            मातृत्व AI
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors">
              Features
            </a>
            <a href="#about" className="text-on-surface-variant hover:text-primary transition-colors">
              About
            </a>
            <a href="#contact" className="text-on-surface-variant hover:text-primary transition-colors">
              Contact
            </a>
          </nav>
          <Button>
            <LogIn size={18} className="mr-2" />
            Login
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;

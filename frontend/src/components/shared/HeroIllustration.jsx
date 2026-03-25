import { motion } from "framer-motion";
import { Baby, HeartPulse, Stethoscope } from "lucide-react";

function HeroIllustration() {
  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.2,
        type: "spring",
        stiffness: 150,
        damping: 10,
      },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative hidden md:flex justify-center items-center bg-surface rounded-3xl h-96 w-full"
    >
      <motion.div
        className="absolute w-48 h-48 bg-primary/10 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        custom={0}
        variants={iconVariants}
        initial="initial"
        animate="animate"
        className="absolute top-16 left-16 p-4 bg-background rounded-full shadow-lg"
      >
        <HeartPulse size={32} className="text-secondary" />
      </motion.div>

      <motion.div
        custom={1}
        variants={iconVariants}
        initial="initial"
        animate="animate"
        className="z-10 p-8 bg-background rounded-full shadow-2xl"
      >
        <Baby size={80} className="text-primary" />
      </motion.div>

      <motion.div
        custom={2}
        variants={iconVariants}
        initial="initial"
        animate="animate"
        className="absolute bottom-16 right-16 p-4 bg-background rounded-full shadow-lg"
      >
        <Stethoscope size={32} className="text-accent" />
      </motion.div>
    </motion.div>
  );
}

export default HeroIllustration;

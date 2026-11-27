import { motion, useReducedMotion } from "framer-motion";

const pageVariants = (reduceMotion) => ({
  initial: {
    opacity: 0,
    y: reduceMotion ? 0 : 8,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: reduceMotion ? 0 : -8,
  },
});

const pageTransition = (reduceMotion) => ({
  type: "tween",
  ease: reduceMotion ? "linear" : "easeOut",
  duration: reduceMotion ? 0.01 : 0.2,
});

const PageTransition = ({ children }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants(!!reduceMotion)}
      transition={pageTransition(!!reduceMotion)}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

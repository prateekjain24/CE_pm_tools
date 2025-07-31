import { type MotionProps, motion } from "framer-motion"
import { createElement, forwardRef } from "react"

/**
 * Creates safe motion components that handle unmounting gracefully
 * Prevents "Cannot read properties of undefined" errors during animations
 */

// Safe motion variants with null checks
export const safeMotionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3 },
  },
}

// Type for HTML element props
type HTMLMotionProps<T> = MotionProps & React.HTMLAttributes<T>

// Safe motion div with error boundary
export const SafeMotionDiv = forwardRef<HTMLDivElement, HTMLMotionProps<HTMLDivElement>>(
  (props, ref) => {
    try {
      return createElement(motion.div, { ref, ...props })
    } catch (error) {
      console.warn("Motion animation error:", error)
      // Fallback to regular div without animations
      const {
        initial: _,
        animate: __,
        exit: ___,
        transition: ____,
        variants: _____,
        ...htmlProps
      } = props
      return createElement("div", { ref, ...htmlProps })
    }
  }
)

SafeMotionDiv.displayName = "SafeMotionDiv"

// Helper to create safe animation props
export function createSafeAnimationProps(
  animated: boolean = true,
  variant: keyof typeof safeMotionVariants = "fadeIn"
): MotionProps {
  if (!animated) return {}

  const selectedVariant = safeMotionVariants[variant]
  return {
    initial: selectedVariant.initial,
    animate: selectedVariant.animate,
    exit: selectedVariant.exit,
    transition: selectedVariant.transition,
  }
}

// Hook to safely handle animation lifecycle
export function useSafeAnimation(enabled: boolean = true) {
  const shouldAnimate = enabled && typeof window !== "undefined"

  return {
    shouldAnimate,
    animationProps: createSafeAnimationProps(shouldAnimate),
  }
}

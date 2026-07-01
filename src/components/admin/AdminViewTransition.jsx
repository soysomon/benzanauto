import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const ENTER_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
}

export default function AdminViewTransition({
  children,
  className = '',
  ...props
}) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      key={location.pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={ENTER_TRANSITION}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

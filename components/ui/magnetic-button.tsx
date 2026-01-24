'use client'

import { motion } from 'framer-motion'
import { useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
  onClick?: () => void
  href?: string
  disabled?: boolean
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  onClick,
  href,
  disabled = false,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: MouseEvent) => {
    const ref = href ? anchorRef.current : buttonRef.current
    if (disabled || !ref) return

    const { clientX, clientY } = e
    const { left, top, width, height } = ref.getBoundingClientRect()
    const x = (clientX - left - width / 2) * strength
    const y = (clientY - top - height / 2) * strength
    setPosition({ x, y })
  }

  const reset = () => setPosition({ x: 0, y: 0 })

  const springTransition = {
    type: 'spring' as const,
    stiffness: 150,
    damping: 15,
    mass: 0.1,
  }

  if (href) {
    return (
      <motion.a
        ref={anchorRef}
        href={href}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        animate={position}
        transition={springTransition}
        className={cn('btn-magnetic', className)}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      type="button"
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={position}
      transition={springTransition}
      className={cn('btn-magnetic', className)}
    >
      {children}
    </motion.button>
  )
}

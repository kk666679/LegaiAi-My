import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
}

export default function GlassCard({
  children,
  className,
  hoverEffect = true
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hoverEffect ? { y: -4, scale: 1.02 } : {}}
className={cn(
        "glass-card group",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </motion.div>
  )
}

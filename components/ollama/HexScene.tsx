'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const hexConfigs = [
  { size: 120, x: '10%', y: '15%', rx: 10, ry: 20, delay: 0 },
  { size: 90, x: '80%', y: '10%', rx: -15, ry: 30, delay: -2 },
  { size: 70, x: '70%', y: '55%', rx: 20, ry: -10, delay: -4 },
  { size: 100, x: '15%', y: '65%', rx: -5, ry: 15, delay: -6 },
  { size: 60, x: '50%', y: '80%', rx: 25, ry: -20, delay: -3 },
  { size: 80, x: '90%', y: '75%', rx: -10, ry: 25, delay: -1 },
] as const

export function HexScene() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const mouseX = useRef(0)
  const mouseY = useRef(0)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth - 0.5) * 20
      mouseY.current = (e.clientY / window.innerHeight - 0.5) * 20
      scene.style.transform = `rotateY(${mouseX.current}deg) rotateX(${-mouseY.current}deg)`
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div 
      ref={sceneRef}
      className="fixed inset-0 pointer-events-none hex-scene z-0"
      style={{perspective: '1200px', perspectiveOrigin: '50% 50%'}}
    >
      {hexConfigs.map((cfg, i) => (
        <motion.div
          key={i}
          className="hexagon-3d absolute"
          style={{
            width: cfg.size,
            height: cfg.size,
            left: cfg.x,
            top: cfg.y,
            '--rx': `${cfg.rx}deg`,
            '--ry': `${cfg.ry}deg` as any,
            animationDelay: `${cfg.delay}s`,
          } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: i * 0.1 }}
        >
          <div className="hex-face w-full h-full absolute" />
          <motion.div 
            className="hex-face hex-face-glow w-full h-full absolute"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>
      ))}
    </div>
  )
}

import { useRef } from 'react'

const MIN_DISTANCE = 50

export function useHorizontalSwipe(onSwipe: (delta: -1 | 1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const t = e.changedTouches[0]
      const dx = t.clientX - s.x
      const dy = t.clientY - s.y
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
      onSwipe(dx < 0 ? 1 : -1)
    },
    onTouchCancel: () => {
      start.current = null
    },
  }
}

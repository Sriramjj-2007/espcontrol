import React, { useEffect, useRef, useState } from 'react'

type Orientation = 'vertical' | 'horizontal'

interface SliderProps {
  min?: number
  max?: number
  value: number
  onChange: (v: number) => void
  orientation?: Orientation
  springReturn?: boolean
  ariaLabel?: string
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export default function Slider({
  min = -100,
  max = 100,
  value,
  onChange,
  orientation = 'vertical',
  springReturn = false,
  ariaLabel
}: SliderProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const activePointerId = useRef<number | null>(null)
  const animRef = useRef<number | null>(null)
  const [localValue, setLocalValue] = useState<number>(value)
  const localValueRef = useRef<number>(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    localValueRef.current = localValue
  }, [localValue])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const getPos = (e: PointerEvent | Touch | MouseEvent) => {
    const el = ref.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    if (orientation === 'vertical') {
      const y = ('clientY' in e ? e.clientY : (e as Touch).clientY) - rect.top
      const pct = 1 - clamp(y / rect.height, 0, 1)
      return min + pct * (max - min)
    } else {
      const x = ('clientX' in e ? e.clientX : (e as Touch).clientX) - rect.left
      const pct = clamp(x / rect.width, 0, 1)
      return min + pct * (max - min)
    }
  }

  const startDrag = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    dragging.current = true
    activePointerId.current = e.pointerId
    // prevent page scrolling while dragging
    document.body.style.overflow = 'hidden'
    // capture this pointer so this element receives subsequent events
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const v = Math.round(getPos(e.nativeEvent))
    setLocalValue(v)
    onChange(v)
  }

  const pointerDown = (e: React.PointerEvent) => {
    startDrag(e)
  }

  const pointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return
    e.preventDefault()
    const v = Math.round(getPos(e.nativeEvent))
    setLocalValue(v)
    onChange(v)
  }

  const pointerUp = (e: React.PointerEvent) => {
    if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return
    dragging.current = false
    activePointerId.current = null
    document.body.style.overflow = ''
    const el = ref.current
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    if (springReturn) animateToZero()
  }

  const animateToZero = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const step = () => {
      const current = localValueRef.current
      const next = Math.round(current - current * 0.2)
      if (Math.abs(next) <= 1) {
        setLocalValue(0)
        onChange(0)
        animRef.current = null
        return
      }
      setLocalValue(next)
      onChange(next)
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }

  // Allow mouse wheel/keyboard for accessibility
  const handleKey = (e: React.KeyboardEvent) => {
    let delta = 0
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') delta = 5
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') delta = -5
    if (delta !== 0) {
      const v = clamp(localValue + delta, min, max)
      setLocalValue(v)
      onChange(v)
    }
  }

  const pct = (localValue - min) / (max - min)

  return (
    <div
      ref={ref}
      className={`slider ${orientation}`}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onKeyDown={handleKey}
      tabIndex={0}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={localValue}
    >
      <div className="track" />
      {orientation === 'vertical' ? (
        <div className="thumb" style={{ bottom: `${pct * 100}%` }} />
      ) : (
        <div className="thumb" style={{ left: `${pct * 100}%` }} />
      )}
    </div>
  )
}

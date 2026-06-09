import { useEffect, useRef, useState, useCallback } from 'react'

export interface ControlState {
  throttle: number // -100..100
  steering: number // -100..100
}

interface UseControlOptions {
  send: (msg: string) => void
  sendWhenDisconnected?: boolean
}

export function useControlState(options: UseControlOptions) {
  const { send } = options
  const [throttle, setThrottle] = useState<number>(0)
  const [steering, setSteering] = useState<number>(0)
  const lastSentRef = useRef<string>('')
  const pendingRef = useRef<ControlState>({ throttle: 0, steering: 0 })
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    // transmit at up to 20Hz (every 50ms) but only when changed
    intervalRef.current = window.setInterval(() => {
      const msg = `${pendingRef.current.throttle},${pendingRef.current.steering}`
      if (msg !== lastSentRef.current) {
        try {
          send(msg)
          lastSentRef.current = msg
        } catch {
          // ignore send errors
        }
      }
    }, 50)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [send])

  // update pending message whenever values change
  useEffect(() => {
    pendingRef.current = { throttle, steering }
  }, [throttle, steering])

  // Auto-reset to 0,0 after 5 seconds of inactivity (no movement changes)
  const idleTimeoutRef = useRef<number | null>(null)

  const recordActivity = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
    }
    idleTimeoutRef.current = window.setTimeout(() => {
      // Send 0,0 after idle period (sliders already auto-return via springReturn)
      try {
        send('0,0')
        lastSentRef.current = '0,0'
      } catch {
        /* ignore */
      }
    }, 5000)
  }, [send])

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
      }
    }
  }, [])

  const updateThrottle = useCallback((v: number) => {
    setThrottle(clamp(v, -100, 100))
    recordActivity()
  }, [recordActivity])

  const updateSteering = useCallback((v: number) => {
    setSteering(clamp(v, -100, 100))
    recordActivity()
  }, [recordActivity])

  const reset = useCallback(() => {
    setThrottle(0)
    setSteering(0)
    pendingRef.current = { throttle: 0, steering: 0 }
    try {
      send('0,0')
      lastSentRef.current = '0,0'
    } catch {
      /* ignore */
    }
  }, [send])

  // On page hide or unload, send 0,0 immediately
  useEffect(() => {
    const handleHide = () => {
      try {
        send('0,0')
      } catch {
        /* ignore */
      }
    }
    const handleBeforeUnload = (ev: BeforeUnloadEvent) => {
      try {
        send('0,0')
      } catch {
        /* ignore */
      }
      // allow default
    }

    document.addEventListener('visibilitychange', handleHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [send])

  return {
    throttle,
    steering,
    updateThrottle,
    updateSteering,
    reset,
    lastTransmitted: lastSentRef.current
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

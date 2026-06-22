import { useEffect, useRef, useState, useCallback } from 'react'

export interface ControlState {
  throttle: number // -100..100
  steering: number // -100..100
  f1: number // 0 or 1
  f2: number // 0 or 1
}

interface UseControlOptions {
  send: (msg: string) => void
  sendWhenDisconnected?: boolean
  f1Active?: boolean
  f2Active?: boolean
}

export function useControlState(options: UseControlOptions) {
  const { send, f1Active = false, f2Active = false } = options
  const [throttle, setThrottle] = useState<number>(0)
  const [steering, setSteering] = useState<number>(0)
  const lastSentRef = useRef<string>('')
  const pendingRef = useRef<ControlState>({ throttle: 0, steering: 0, f1: 0, f2: 0 })
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    // transmit at 20Hz (every 50ms) continuously
    intervalRef.current = window.setInterval(() => {
      const msg = formatControlMessage(pendingRef.current)
      try {
        send(msg)
        lastSentRef.current = msg
      } catch {
        // ignore send errors
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
    pendingRef.current = {
      throttle,
      steering,
      f1: f1Active ? 1 : 0,
      f2: f2Active ? 1 : 0
    }
  }, [throttle, steering, f1Active, f2Active])

  // Auto-reset to 0,0 after 5 seconds of inactivity (no movement changes)
  const idleTimeoutRef = useRef<number | null>(null)

  const recordActivity = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
    }
    idleTimeoutRef.current = window.setTimeout(() => {
      // Send neutral movement after idle period while preserving feature toggles.
      try {
        const msg = formatControlMessage({ ...pendingRef.current, throttle: 0, steering: 0 })
        send(msg)
        lastSentRef.current = msg
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
    pendingRef.current = { throttle: 0, steering: 0, f1: 0, f2: 0 }
    try {
      send('0,0,0,0')
      lastSentRef.current = '0,0,0,0'
    } catch {
      /* ignore */
    }
  }, [send])

  // On page hide or unload, send 0,0 immediately
  useEffect(() => {
    const handleHide = () => {
      try {
        send('0,0,0,0')
      } catch {
        /* ignore */
      }
    }
    const handleBeforeUnload = (ev: BeforeUnloadEvent) => {
      try {
        send('0,0,0,0')
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

function formatControlMessage(state: ControlState) {
  return `${state.throttle},${state.steering},${state.f1},${state.f2}`
}

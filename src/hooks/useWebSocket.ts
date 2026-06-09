import { useEffect, useRef, useState, useCallback } from 'react'

export type WsStatus = 'connected' | 'connecting' | 'disconnected'

interface UseWebSocketResult {
  status: WsStatus
  send: (msg: string) => void
  lastReceived: string | null
  close: () => void
}

const WS_URL = 'ws://192.168.4.1:81'

export function useWebSocket(): UseWebSocketResult {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const attempts = useRef(0)
  const [status, setStatus] = useState<WsStatus>('connecting')
  const [lastReceived, setLastReceived] = useState<string | null>(null)

  const connect = useCallback(() => {
    setStatus('connecting')
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        attempts.current = 0
        setStatus('connected')
      }

      ws.onmessage = (ev) => {
        setLastReceived(ev.data)
      }

      ws.onclose = () => {
        setStatus('disconnected')
        scheduleReconnect()
      }

      ws.onerror = () => {
        // Errors lead to close event; ensure state
        setStatus('disconnected')
        try {
          ws.close()
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setStatus('disconnected')
      scheduleReconnect()
    }
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return
    attempts.current += 1
    const delay = Math.min(30000, 500 * attempts.current)
    reconnectTimer.current = window.setTimeout(() => {
      reconnectTimer.current = null
      connect()
    }, delay)
  }, [connect])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      try {
        wsRef.current?.close()
      } catch {
        /* ignore */
      }
    }
  }, [connect])

  const send = useCallback((msg: string) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(msg)
      }
    } catch {
      // swallow send errors
    }
  }, [])

  const close = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    try {
      wsRef.current?.close()
    } catch {
      /* ignore */
    }
    setStatus('disconnected')
  }, [])

  return { status, send, lastReceived, close }
}

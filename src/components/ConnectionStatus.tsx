import React from 'react'
import { WsStatus } from '../hooks/useWebSocket'

interface Props {
  status: WsStatus
}

export default function ConnectionStatus({ status }: Props) {
  const color = status === 'connected' ? 'var(--ok)' : status === 'connecting' ? 'var(--warn)' : 'var(--bad)'
  const label = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting' : 'Disconnected'
  return (
    <div className="status">
      <span className="dot" style={{ background: color }} />
      <span className="label">{label}</span>
    </div>
  )
}

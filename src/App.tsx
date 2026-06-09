import React from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useControlState } from './hooks/useControlState'
import Slider from './components/Slider'
import ConnectionStatus from './components/ConnectionStatus'
import EmergencyStop from './components/EmergencyStop'

export default function App() {
  const { status, send, lastReceived } = useWebSocket()
  const control = useControlState({ send })

  const handleEmergency = React.useCallback(() => {
    control.reset()
    try {
      send('0,0')
    } catch {
      /* ignore */
    }
  }, [control, send])

  return (
    <div className="app">
      <header className="topbar">
        <ConnectionStatus status={status} />
        <div className="values">
          <div>Throttle: <span className="value">{control.throttle}</span></div>
          <div>Steering: <span className="value">{control.steering}</span></div>
        </div>
        <div className="last">Last: <span className="mono">{'' /* placeholder for last transmitted */}</span></div>
      </header>

      <main className="controller">
        <section className="left">
          <Slider
            orientation="vertical"
            value={control.throttle}
            onChange={control.updateThrottle}
            springReturn={true}
            ariaLabel="Throttle"
          />
        </section>

        <section className="center">
          <EmergencyStop onEmergency={handleEmergency} />
          <div className="received">Received: <span className="mono">{lastReceived ?? '-'}</span></div>
        </section>

        <section className="right">
          <Slider
            orientation="horizontal"
            value={control.steering}
            onChange={control.updateSteering}
            springReturn={true}
            ariaLabel="Steering"
          />
        </section>
      </main>
    </div>
  )
}

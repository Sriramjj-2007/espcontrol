import React from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useControlState } from './hooks/useControlState'
import Slider from './components/Slider'
import ConnectionStatus from './components/ConnectionStatus'
import EmergencyStop from './components/EmergencyStop'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function App() {
  const { status, send, lastReceived } = useWebSocket()
  const [isF1Active, setIsF1Active] = React.useState(false)
  const [isF2Active, setIsF2Active] = React.useState(false)
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const control = useControlState({ send, f1Active: isF1Active, f2Active: isF2Active })

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = React.useCallback(async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }, [installPrompt])

  const handleFeature = React.useCallback((feature: 'F1' | 'F2') => {
    if (feature === 'F1') {
      setIsF1Active((active) => !active)
    } else {
      setIsF2Active((active) => !active)
    }
  }, [])

  const handleFeaturePointerDown = React.useCallback((
    event: React.PointerEvent<HTMLButtonElement>,
    feature: 'F1' | 'F2'
  ) => {
    event.preventDefault()
    event.stopPropagation()
    handleFeature(feature)
  }, [handleFeature])

  const handleFeatureKeyDown = React.useCallback((
    event: React.KeyboardEvent<HTMLButtonElement>,
    feature: 'F1' | 'F2'
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleFeature(feature)
  }, [handleFeature])

  const handleEmergency = React.useCallback(() => {
    setIsF1Active(false)
    setIsF2Active(false)
    control.reset()
    try {
      send('0,0,0,0')
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
        {installPrompt ? (
          <button className="install-button" onClick={handleInstall}>
            Install
          </button>
        ) : null}
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
          <div className="steering-area">
            <Slider
              orientation="horizontal"
              value={control.steering}
              onChange={control.updateSteering}
              springReturn={true}
              ariaLabel="Steering"
            />
            <div className="feature-buttons" aria-label="Extra features">
              <button
                type="button"
                className={`feature-button ${isF1Active ? 'active' : ''}`}
                onPointerDown={(event) => handleFeaturePointerDown(event, 'F1')}
                onKeyDown={(event) => handleFeatureKeyDown(event, 'F1')}
                aria-pressed={isF1Active}
              >
                F1
              </button>
              <button
                type="button"
                className={`feature-button ${isF2Active ? 'active' : ''}`}
                onPointerDown={(event) => handleFeaturePointerDown(event, 'F2')}
                onKeyDown={(event) => handleFeatureKeyDown(event, 'F2')}
                aria-pressed={isF2Active}
              >
                F2
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

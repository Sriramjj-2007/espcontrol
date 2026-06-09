import React from 'react'

interface Props {
  onEmergency: () => void
}

export default function EmergencyStop({ onEmergency }: Props) {
  return (
    <button className="emergency" onClick={onEmergency} aria-label="Emergency Stop">
      STOP  
    </button>
  )
}

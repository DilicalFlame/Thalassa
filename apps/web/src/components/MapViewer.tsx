'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useState } from 'react'
import { ViewToggle } from './flatmap/ViewToggle'
import { DynamicCamera } from './DynamicCamera'
import { UnifiedScene } from './flatmap/UnifiedScene'
import { FloatDossier } from '@/components/floats/FloatDossier'

const Loader = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#00ff00',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '18px',
        zIndex: 100,
      }}
    >
      Loading Geographic Data...
    </div>
  )
}

export const MapViewer = () => {
  const [is3D, setIs3D] = useState(true)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [selectedFloatId, setSelectedFloatId] = useState<number | null>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleFloatClick = (platformId: number) => {
    setSelectedFloatId(platformId)
  }

  const closeDossier = () => {
    setSelectedFloatId(null)
  }

  const resetIdleTimer = () => {
    // Clear any existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    // Set a new timer
    idleTimerRef.current = setTimeout(() => {
      setIsAutoRotating(true)
    }, 10000) // 10 seconds
  }

  /** Called when the user starts interacting with the controls. */
  const handleInteractionStart = () => {
    setIsAutoRotating(false)
    // Clear the timer so it doesn't restart while the user is interacting
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
  }

  /** Called when the user finishes an interaction. */
  const handleInteractionEnd = () => {
    resetIdleTimer()
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Suspense fallback={<Loader />}>
        <Canvas gl={{ antialias: true }} dpr={window.devicePixelRatio}>
          <DynamicCamera
            is3D={is3D}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />
          <UnifiedScene
            onFloatClick={handleFloatClick}
            is3D={is3D}
            isAutoRotating={isAutoRotating}
            selectedFloatId={selectedFloatId}
          />
        </Canvas>
      </Suspense>

      {/* Conditionally render the dossier popup */}
      {selectedFloatId && (
        <FloatDossier platformId={selectedFloatId} onClose={closeDossier} />
      )}

      <ViewToggle is3D={is3D} setIs3D={setIs3D} />
    </div>
  )
}

'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useState } from 'react'
import { ViewToggle } from './flatmap/ViewToggle'
import { DynamicCamera } from './DynamicCamera'
import { UnifiedScene } from './flatmap/UnifiedScene'
import { FloatDossier } from '@/components/floats/FloatDossier'
import { useFadeIn } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'
import AnimatedLoader from './AnimatedLoader'

const Loader = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
      }}
    >
      <AnimatedLoader message='Loading Geographic Data' type='wave' />
    </div>
  )
}

export const MapViewer = () => {
  const [is3D, setIs3D] = useState(true)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [selectedFloatId, setSelectedFloatId] = useState<number | null>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useFadeIn<HTMLDivElement>(0, 'none')

  const handleFloatClick = (platformId: number) => {
    // Haptic feedback for float selection
    hapticUtils.floatSelect()
    setSelectedFloatId(platformId)
  }

  const closeDossier = () => {
    // Light haptic feedback for closing
    hapticUtils.modalClose()
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
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
    >
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

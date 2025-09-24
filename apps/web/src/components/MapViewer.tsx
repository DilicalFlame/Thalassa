'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useState, useCallback, useEffect } from 'react'
import { ViewToggle } from './flatmap/ViewToggle'
import { DynamicCamera } from './DynamicCamera'
import { UnifiedScene } from './flatmap/UnifiedScene'
import { FloatDossier } from '@/components/floats/FloatDossier'
import { useFadeIn } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'
import AnimatedLoader from './AnimatedLoader'
import { TimeControls } from './TimeControls'

interface Msg {
  id: number
  text: string
  created: number
}

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
  // Time / animation state
  const [year, setYear] = useState(2023)
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [endDate, setEndDate] = useState<string | undefined>(undefined)
  const [play, setPlay] = useState(false)
  const [speedMs, setSpeedMs] = useState(500)
  const [messages, setMessages] = useState<Msg[]>([])

  // Clean up old messages every 5s
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      setMessages((msgs) => msgs.filter((m) => now - m.created < 4000))
    }, 2000)
    return () => clearInterval(t)
  }, [])
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

  const handleYearChange = useCallback((y: number) => {
    setYear(y)
    setStartDate(undefined)
    setEndDate(undefined)
    setPlay(false)
  }, [])

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }, [])

  const handleFrameFloat = useCallback(
    (fp: { platform_id: number; lat: number; lon: number; date: string }) => {
      const msg: Msg = {
        id: Math.random(),
        text: `Loaded float ${fp.platform_id} @ ${fp.lat.toFixed(2)}, ${fp.lon.toFixed(2)} (${new Date(fp.date).toISOString()})`,
        created: Date.now(),
      }
      setMessages((prev) => [...prev.slice(-4), msg])
    },
    []
  )

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
            year={year}
            startDate={startDate}
            endDate={endDate}
            play={play}
            speedMs={speedMs}
            onFrameFloat={handleFrameFloat}
          />
        </Canvas>
      </Suspense>

      {/* Conditionally render the dossier popup */}
      {selectedFloatId && (
        <FloatDossier
          platformId={selectedFloatId}
          onClose={closeDossier}
          year={year}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <ViewToggle is3D={is3D} setIs3D={setIs3D} />
      <TimeControls
        onYearChange={handleYearChange}
        onRangeChange={handleRangeChange}
        onPlayToggle={setPlay}
        onSpeedChange={setSpeedMs}
      />

      {/* Messages overlay */}
      {messages.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 340,
            zIndex: 80,
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: '#d6faff',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.3,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

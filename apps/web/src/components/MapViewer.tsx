'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback, useEffect } from 'react'
import { ViewToggle } from './flatmap/ViewToggle'
import Link from 'next/link'
import { DynamicCamera } from './DynamicCamera'
import { UnifiedScene } from './flatmap/UnifiedScene'
import { FloatDossier } from '@/components/floats/FloatDossier'
import { useFadeIn } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'
import AnimatedLoader from './AnimatedLoader'
import { TimeControls } from './TimeControls'
import { CameraFocus } from './CameraFocus'

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
  const [selectedFloatId, setSelectedFloatId] = useState<number | null>(null)
  const [selectedFloatLat, setSelectedFloatLat] = useState<number | null>(null)
  const [selectedFloatLon, setSelectedFloatLon] = useState<number | null>(null)
  // Time / animation state
  const [year, setYear] = useState(2023)
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [endDate, setEndDate] = useState<string | undefined>(undefined)
  const [play, setPlay] = useState(false)
  const [speedMs, setSpeedMs] = useState(500)
  const [messages, setMessages] = useState<Msg[]>([])
  const [isFocusing, setIsFocusing] = useState(false)
  // Dossier open in range view
  const dossierOpen = !!(selectedFloatId && startDate && endDate)
  // Desired final offset (screen space left bias)
  const FRAMED_OFFSET = -1.4
  // If focusing, keep previous offset (do not snap back to 0) to avoid pulse.
  const framingOffsetX = dossierOpen ? FRAMED_OFFSET : 0

  // Safety: auto-clear focusing if it somehow doesn't end within 2s
  useEffect(() => {
    if (!isFocusing) return
    const t = setTimeout(() => setIsFocusing(false), 2000)
    return () => clearTimeout(t)
  }, [isFocusing])

  // Clean up old messages every 5s
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      setMessages((msgs) => msgs.filter((m) => now - m.created < 4000))
    }, 2000)
    return () => clearInterval(t)
  }, [])
  const containerRef = useFadeIn<HTMLDivElement>(0, 'none')

  const handleFloatClick = (platformId: number, lat: number, lon: number) => {
    // Haptic feedback for float selection
    hapticUtils.floatSelect()
    setSelectedFloatId(platformId)
    setSelectedFloatLat(lat)
    setSelectedFloatLon(lon)
    // Start focus (CameraFocus will also set) – defensive in case callback order changes
    setIsFocusing(true)
  }

  const closeDossier = () => {
    // Light haptic feedback for closing
    hapticUtils.modalClose()
    setSelectedFloatId(null)
    setSelectedFloatLat(null)
    setSelectedFloatLon(null)
    setIsFocusing(false) // ensure controls restored
  }

  // Interaction handlers simplified (auto-rotation disabled)
  const handleInteractionStart = () => {}
  const handleInteractionEnd = () => {}

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
      className={`map-container ${selectedFloatId && startDate && endDate ? 'panel-open' : ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={<Loader />}>
        <Canvas
          gl={{ antialias: true }}
          dpr={[
            1,
            Math.min(
              1.75,
              typeof window !== 'undefined' ? window.devicePixelRatio : 1
            ),
          ]}
        >
          <DynamicCamera
            is3D={is3D}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
            isLocked={isFocusing}
          />
          <CameraFocus
            lat={selectedFloatLat}
            lon={selectedFloatLon}
            active={!!selectedFloatId}
            is3D={is3D}
            onFocusStart={() => {
              setIsFocusing(true)
            }}
            onFocusEnd={() => {
              setIsFocusing(false)
            }}
          />
          <UnifiedScene
            onFloatClick={handleFloatClick}
            is3D={is3D}
            selectedFloatId={selectedFloatId}
            year={year}
            startDate={startDate}
            endDate={endDate}
            play={play}
            speedMs={speedMs}
            onFrameFloat={handleFrameFloat}
            framingOffsetX={framingOffsetX}
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
          panel={!!(startDate && endDate)}
        />
      )}

      {/* Bottom-left controls: View toggle above Chat button */}
      <div className='fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3'>
        <ViewToggle is3D={is3D} setIs3D={setIs3D} />
        <Link
          href='/chat'
          onClick={() => {
            hapticUtils.buttonPress()
            setTimeout(() => hapticUtils.pageTransition(), 100)
          }}
          className='inline-flex items-center rounded-lg border border-blue-500 bg-blue-600/90 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-blue-500/90'
        >
          <svg
            className='mr-2 h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
          Chat with AI
        </Link>
      </div>
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

      {/* Debug overlay (remove later) */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.45)',
          padding: '6px 10px',
          fontSize: 11,
          borderRadius: 6,
          fontFamily: 'monospace',
          pointerEvents: 'none',
          zIndex: 90,
        }}
      >
        <div>selected: {selectedFloatId ?? 'none'}</div>
        <div>mode: {startDate && endDate ? 'range' : 'year'}</div>
        <div>
          lat/lon: {selectedFloatLat?.toFixed(2) ?? '-'},{' '}
          {selectedFloatLon?.toFixed(2) ?? '-'}
        </div>
      </div>
    </div>
  )
}

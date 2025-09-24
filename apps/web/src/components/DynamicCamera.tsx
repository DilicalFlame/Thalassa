'use client'

import {
  PerspectiveCamera,
  OrthographicCamera,
  TrackballControls,
  MapControls,
} from '@react-three/drei'

interface DynamicCameraProps {
  is3D: boolean
  onInteractionStart: () => void
  onInteractionEnd: () => void
  /** When true, user interaction is disabled (e.g., while auto focusing). */
  isLocked?: boolean
}

export const DynamicCamera = ({
  is3D,
  onInteractionStart,
  onInteractionEnd,
  isLocked = false,
}: DynamicCameraProps) => {
  if (is3D) {
    return (
      <>
        {/* Centered default camera; framing offset handled during focus animation */}
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        {/* --- CHANGE 2: Replace OrbitControls with TrackballControls --- */}
        <TrackballControls
          enabled={!isLocked}
          /* Disable panning & zoom for a more cinematic lock when focusing */
          noPan={true}
          noZoom={false}
          rotateSpeed={2.5}
          onStart={onInteractionStart}
          onEnd={onInteractionEnd}
        />
      </>
    )
  }

  // 2D mode with orthographic camera (no changes here)
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 10, 0]} // Look down from above
        zoom={45}
      />
      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minZoom={10}
        maxZoom={200}
      />
    </>
  )
}

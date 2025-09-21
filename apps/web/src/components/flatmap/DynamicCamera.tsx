'use client'

import {
  PerspectiveCamera,
  OrthographicCamera,
  OrbitControls,
  MapControls,
} from '@react-three/drei'

interface DynamicCameraProps {
  is3D: boolean
}

export const DynamicCamera = ({ is3D }: DynamicCameraProps) => {
  if (is3D) {
    return (
      <>
        {/* The 3D Perspective Camera */}
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={75} />
        {/* Use OrbitControls for proper 3D rotation */}
        <OrbitControls
          enableDamping={true}
          dampingFactor={0.05}
          enablePan={true}
          enableZoom={true}
          minDistance={8}
          maxDistance={50}
        />
      </>
    )
  }

  // 2D mode with orthographic camera
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 10, 0]} // Look down from above
        zoom={20}
      />
      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minZoom={5}
        maxZoom={100}
      />
    </>
  )
}

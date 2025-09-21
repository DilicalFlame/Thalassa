'use client'

import {
  PerspectiveCamera,
  OrthographicCamera,
  TrackballControls,
  MapControls,
} from '@react-three/drei'

interface DynamicCameraProps {
  is3D: boolean
}

export const DynamicCamera = ({ is3D }: DynamicCameraProps) => {
  if (is3D) {
    return (
      <>
        {/* The 3D Perspective Camera (no changes here) */}
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        {/* --- CHANGE 2: Replace OrbitControls with TrackballControls --- */}
        <TrackballControls
          // By default, TrackballControls allows free rotation.
          // You can add props here to customize the feel.
          noPan={true} // Disables panning, keeping focus on rotation. Set to false for more freedom.
          rotateSpeed={2.5} // Adjust the speed of rotation.
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

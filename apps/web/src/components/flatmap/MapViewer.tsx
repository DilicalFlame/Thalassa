'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { ViewToggle } from './ViewToggle'
import { DynamicCamera } from './DynamicCamera'
import { UnifiedScene } from './UnifiedScene'

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
        zIndex: 100
      }}
    >
      Loading Geographic Data...
    </div>
  )
}

export const MapViewer = () => {
  const [is3D, setIs3D] = useState(true)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Suspense fallback={<Loader />}>
        <Canvas
          gl={{ antialias: true }}
          dpr={window.devicePixelRatio}
        >
          <DynamicCamera is3D={is3D} />
          <UnifiedScene is3D={is3D} />
        </Canvas>
      </Suspense>
      
      <ViewToggle is3D={is3D} setIs3D={setIs3D} />
    </div>
  )
}

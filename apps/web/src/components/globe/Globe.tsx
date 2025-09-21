'use client'

import { Canvas } from '@react-three/fiber'
import { GlobeScene } from './Scene'
import { Suspense } from 'react'

// A simple loader component
const Loader = () => {
  return <div className='loader'>Loading Geographic Data...</div>
}

export const Globe = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Suspense provides a fallback UI while assets are loading */}
      <Suspense fallback={<Loader />}>
        <Canvas
          camera={{ position: [0, 0, 15], fov: 75 }}
          gl={{ antialias: true }}
          dpr={window.devicePixelRatio} // For sharp rendering
        >
          <GlobeScene />
        </Canvas>
      </Suspense>
      {/* We can also show the loader outside the canvas initially */}
      <Loader />
    </div>
  )
}

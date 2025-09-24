'use client'

import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { SolidLandmasses } from '@/components/globe/LandMasses'
import { FloatDots } from '@/components/floats/FloatDots'

interface UnifiedSceneProps {
  is3D: boolean
  onFloatClick: (platformId: number, lat: number, lon: number) => void
  selectedFloatId?: number | null
  year?: number
  startDate?: string
  endDate?: string
  play?: boolean
  speedMs?: number
  onFrameFloat?: (fp: {
    platform_id: number
    lat: number
    lon: number
    date: string
  }) => void
  /** Horizontal framing offset applied to entire globe group (world units). */
  framingOffsetX?: number
}

export const UnifiedScene = ({
  is3D,
  onFloatClick,
  selectedFloatId = null,
  year = 2023,
  startDate,
  endDate,
  play = false,
  speedMs = 500,
  onFrameFloat,
  framingOffsetX = 0,
}: UnifiedSceneProps) => {
  const [geoData, setGeoData] = useState(null)
  const globeGroupRef = useRef<THREE.Group>(null!) // Use non-null assertion

  useEffect(() => {
    fetch('/coastlines_only_50m.geojson')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setGeoData(data)
      })
      .catch((error) => console.error('Failed to load geographic data:', error))
  }, [])

  // This effect runs whenever the is3D mode changes.
  useEffect(() => {
    if (globeGroupRef.current) {
      if (!is3D) {
        // When switching to 2D, immediately reset the group's rotation.
        globeGroupRef.current.rotation.set(0, 0, 0)
      }
    }
  }, [is3D]) // Dependency array ensures this runs only when is3D changes.

  // Autorotation disabled (was previously conditional on isAutoRotating)
  // useFrame((_, delta) => {
  //   if (globeGroupRef.current && is3D && isAutoRotating) {
  //     globeGroupRef.current.rotation.y += delta * 0.05
  //   }
  // })

  // Define a different size for each camera projection.
  // These values might need tweaking for the perfect look.
  const dynamicDotSize = is3D ? 0.2 : 15

  // Smoothly interpolate group position.x toward framingOffsetX
  useFrame((_, delta) => {
    if (!globeGroupRef.current) return
    const current = globeGroupRef.current.position.x
    const target = framingOffsetX
    if (Math.abs(current - target) < 0.001) {
      globeGroupRef.current.position.x = target
      return
    }
    // simple critically damped like feel via exponential convergence
    const lerpFactor = 1 - Math.exp(-delta * 6) // ~200ms half-life
    globeGroupRef.current.position.x = THREE.MathUtils.lerp(
      current,
      target,
      lerpFactor
    )
  })

  return (
    <>
      <ambientLight intensity={2.5} />

      <group ref={globeGroupRef}>
        {is3D ? (
          // 3D Globe rendering
          <>
            {/* Ocean sphere with solid blue color */}
            <mesh>
              <sphereGeometry args={[4.99, 64, 64]} />
              <meshStandardMaterial
                color='#444444'
                metalness={0.2}
                roughness={0.8}
              />
            </mesh>

            {/* Wireframe sphere - middle layer */}
            <mesh>
              <sphereGeometry args={[5.005, 64, 64]} />
              <meshBasicMaterial
                color='#002244'
                wireframe={true}
                transparent={true}
                opacity={0.15}
              />
            </mesh>
          </>
        ) : (
          // 2D Map rendering - flat plane
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[36, 18]} />
            <meshStandardMaterial
              color='#444444'
              metalness={0.2}
              roughness={0.8}
            />
          </mesh>
        )}

        {/* Render landmasses and data - this works for both views now */}
        {geoData && <SolidLandmasses data={geoData} is3D={is3D} />}

        <FloatDots
          key={is3D ? '3d-dots' : '2d-dots'}
          dotColor='#ffff00'
          dotSize={dynamicDotSize}
          is3D={is3D}
          onFloatClick={onFloatClick}
          selectedFloatId={selectedFloatId}
          year={year}
          startDate={startDate}
          endDate={endDate}
          play={play}
          speedMs={speedMs}
          onFrameFloat={onFrameFloat}
        />
      </group>
    </>
  )
}

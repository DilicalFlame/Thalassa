'use client'

import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { SolidLandmasses } from '@/components/globe/LandMasses'
import { FloatDots } from '@/components/globe/FloatDots'

interface UnifiedSceneProps {
  is3D: boolean
}

export const UnifiedScene = ({ is3D }: UnifiedSceneProps) => {
  const [geoData, setGeoData] = useState(null)
  const globeGroupRef = useRef<THREE.Group>(null!) // Use non-null assertion

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson'
    )
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error('Failed to load geographic data:', error))
  }, [])

  // --- THE FIX ---
  // This effect runs whenever the is3D mode changes.
  useEffect(() => {
    if (globeGroupRef.current) {
      if (!is3D) {
        // When switching to 2D, immediately reset the group's rotation.
        globeGroupRef.current.rotation.set(0, 0, 0)
      }
    }
  }, [is3D]) // Dependency array ensures this runs only when is3D changes.

  // The autorotation logic
  useFrame((_, delta) => {
    if (globeGroupRef.current && is3D) {
      // Rotate slowly
      globeGroupRef.current.rotation.y += delta * 0.05 // Use delta for frame-rate independence
    }
  })

  // --- THE FIX: DYNAMIC DOT SIZE ---
  // Define a different size for each camera projection.
  // These values might need tweaking for the perfect look.
  const dynamicDotSize = is3D ? 0.08 : 20

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
                color='#0066cc'
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
              color='#0066cc'
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
        />
      </group>
    </>
  )
}

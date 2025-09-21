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
  const globeGroupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson'
    )
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error('Failed to load geographic data:', error))
  }, [])

  // Only rotate in 3D mode
  useFrame(() => {
    if (globeGroupRef.current && is3D) {
      globeGroupRef.current.rotation.y += 0.0005
    }
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
          // 2D Map rendering - flat plane with better positioning
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[36, 18]} />
            <meshStandardMaterial
              color='#0066cc'
              metalness={0.2}
              roughness={0.8}
            />
          </mesh>
        )}

        {/* Render landmasses and data - same for both views */}
        {geoData && (
          <SolidLandmasses data={geoData} is3D={is3D} />
        )}

        {/* Float positions - same data, different positioning based on view */}
        <FloatDots dotColor='#ffff00' dotSize={0.08} is3D={is3D} />
      </group>
    </>
  )
}

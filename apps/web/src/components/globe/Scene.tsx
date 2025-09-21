'use client'

import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { SolidLandmasses } from '@/components/globe/LandMasses'
import { FloatDots } from '@/components/globe/FloatDots'

// The main scene component
export const GlobeScene = () => {
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

  useFrame(() => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += 0.0005
    }
  })

  return (
    <>
      <ambientLight intensity={2.5} />
      <OrbitControls
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={50}
        enablePan={false}
      />

      <group ref={globeGroupRef}>
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

        {/* Render components only when data is loaded */}
        {geoData && (
          <>
            {/* Landmasses */}
            <SolidLandmasses data={geoData} />
          </>
        )}

        {/* Float positions - independent of landmass data */}
        <FloatDots dotColor='#ffff00' dotSize={0.08} />
      </group>
    </>
  )
}

// app/components/globe/Scene.tsx
'use client';

import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import { SolidLandmasses, lonLatToVector3 } from "@/components/globe/LandMasses"

// The main scene component
export const GlobeScene = () => {
    const [geoData, setGeoData] = useState(null);
    const globeGroupRef = useRef<THREE.Group>(null);
    const oceanTexture = useTexture('/textures/ocean.jpg'); // Make sure this path is correct

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson')
                .then(res => res.json())
                .then(data => setGeoData(data))
                .catch(error => console.error("Failed to load geographic data:", error));
    }, []);

    useFrame(() => {
        if (globeGroupRef.current) {
            globeGroupRef.current.rotation.y += 0.0005;
        }
    });

    return (
            <>
                <ambientLight intensity={2.5} />
                <OrbitControls enableDamping={true} dampingFactor={0.05} minDistance={8} maxDistance={50} enablePan={false} />

                <group ref={globeGroupRef}>
                    {/* Wireframe sphere */}
                    <mesh>
                        <sphereGeometry args={[5.01, 64, 64]} />
                        <meshBasicMaterial color="#002244" wireframe={true} transparent={true} opacity={0.15} />
                    </mesh>

                    {/* Textured ocean sphere */}
                    <mesh>
                        <sphereGeometry args={[4.99, 64, 64]} />
                        <meshStandardMaterial map={oceanTexture} metalness={0.2} roughness={0.8} />
                    </mesh>

                    {/* Render components only when data is loaded */}
                    {geoData && (
                            <>
                                {/* THIS IS THE IMPORTANT PART: We are only rendering the solid mesh */}
                                <SolidLandmasses data={geoData} />

                                {/* The CountryOutlines component has been removed */}
                            </>
                    )}
                </group>
            </>
    );
};




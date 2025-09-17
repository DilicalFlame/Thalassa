// app/components/globe/Landmasses.tsx
'use client';

import * as THREE from 'three';
import earcut from 'earcut';
import { useMemo } from 'react';

// Utility function to convert lat/lon to a 3D vector
export function lonLatToVector3(lon: number, lat: number, radius = 5): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
}

// This component processes GeoJSON and creates solid, filled-in meshes
export const SolidLandmasses = ({ data }: { data: any }) => {
    const landGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const allVertices: number[] = [];
        const allIndices: number[] = [];
        let vertexOffset = 0;

        data.features.forEach((feature: any) => {
            const polygons = feature.geometry.type === 'Polygon'
                    ? [feature.geometry.coordinates]
                    : feature.geometry.coordinates;

            polygons.forEach((polygon: any[][]) => {
                const outerRing = polygon[0];
                const flatCoordinates = outerRing.flat();

                const indices = earcut(flatCoordinates, [], 2);

                const vertices3D = [];
                for (let i = 0; i < outerRing.length; i++) {
                    const [lon, lat] = outerRing[i];
                    // Place it slightly above the ocean sphere to prevent clipping
                    const vec = lonLatToVector3(lon, lat, 5.001);
                    vertices3D.push(vec.x, vec.y, vec.z);
                }

                allVertices.push(...vertices3D);

                for (const index of indices) {
                    allIndices.push(index + vertexOffset);
                }

                vertexOffset += outerRing.length;
            });
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
        geometry.setIndex(allIndices);
        geometry.computeVertexNormals(); // Important for lighting

        return geometry;
    }, [data]);

    return (
            <mesh geometry={landGeometry}>
                <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.5} />
            </mesh>
    );
};

'use client'

import * as THREE from 'three'
import { useMemo } from 'react'

// TypeScript interfaces for GeoJSON data
interface GeoJSONCoordinate extends Array<number> {
  0: number // longitude
  1: number // latitude
}

interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: GeoJSONCoordinate[][]
}

interface GeoJSONMultiPolygon {
  type: 'MultiPolygon'
  coordinates: GeoJSONCoordinate[][][]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon
  properties: Record<string, unknown>
}

interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// Utility function to convert lat/lon to a 3D vector or 2D coordinates
export function lonLatToVector3(
  lon: number,
  lat: number,
  radius = 5,
  is3D = true
): THREE.Vector3 {
  if (is3D) {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    return new THREE.Vector3(x, y, z)
  } else {
    // For 2D map, use proper Mercator-like projection
    // Map longitude (-180 to 180) to x (-18 to 18) to fit the 36-unit wide plane
    const x = (lon / 180) * 18
    // Map latitude (-90 to 90) to z (-9 to 9) to fit the 18-unit tall plane
    const z = -(lat / 90) * 9 // Negative to flip north-south orientation
    return new THREE.Vector3(x, 0.01, z) // Slightly above the plane
  }
}

// Create points-based landmasses
export const SolidLandmasses = ({
  data,
  is3D = true,
}: {
  data: GeoJSONData
  is3D?: boolean
}) => {
  const pointsGeometry = useMemo(() => {
    const positions: number[] = []

    data.features.forEach((feature: GeoJSONFeature) => {
      const polygons =
        feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates

      polygons.forEach((polygon: GeoJSONCoordinate[][]) => {
        const outerRing = polygon[0]

        if (outerRing.length < 3) return

        // Create dense points along the polygon outline
        for (let i = 0; i < outerRing.length - 1; i++) {
          const [lon1, lat1] = outerRing[i]
          const [lon2, lat2] = outerRing[i + 1] || outerRing[0]

          // Add points along the line segment
          const steps = 10 // Number of points between each coordinate
          for (let j = 0; j <= steps; j++) {
            const t = j / steps
            const lon = lon1 + t * (lon2 - lon1)
            const lat = lat1 + t * (lat2 - lat1)

            const vec = lonLatToVector3(lon, lat, 5.015, is3D)
            positions.push(vec.x, vec.y, vec.z)
          }
        }

        // Fill interior with a grid of points
        const bounds = {
          minLon: Math.min(...outerRing.map((p) => p[0])),
          maxLon: Math.max(...outerRing.map((p) => p[0])),
          minLat: Math.min(...outerRing.map((p) => p[1])),
          maxLat: Math.max(...outerRing.map((p) => p[1])),
        }

        const gridSize = 0.5 // Adjust for density
        for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += gridSize) {
          for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += gridSize) {
            // Simple point-in-polygon check (basic version)
            let inside = false
            for (
              let i = 0, j = outerRing.length - 1;
              i < outerRing.length;
              j = i++
            ) {
              if (
                outerRing[i][1] > lat !== outerRing[j][1] > lat &&
                lon <
                  ((outerRing[j][0] - outerRing[i][0]) *
                    (lat - outerRing[i][1])) /
                    (outerRing[j][1] - outerRing[i][1]) +
                    outerRing[i][0]
              ) {
                inside = !inside
              }
            }

            if (inside) {
              const vec = lonLatToVector3(lon, lat, 5.015, is3D)
              positions.push(vec.x, vec.y, vec.z)
            }
          }
        }
      })
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    return geometry
  }, [data.features, is3D])

  return (
    <points geometry={pointsGeometry}>
      <pointsMaterial color='#00ff00' size={0.06} sizeAttenuation={true} />
    </points>
  )
}

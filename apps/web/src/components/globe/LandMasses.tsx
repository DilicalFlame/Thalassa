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

interface GeoJSONLineString {
  type: 'LineString'
  coordinates: GeoJSONCoordinate[]
}

interface GeoJSONMultiLineString {
  type: 'MultiLineString'
  coordinates: GeoJSONCoordinate[][]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONLineString | GeoJSONMultiLineString
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

    data.features.forEach((feature: GeoJSONFeature, featureIndex: number) => {
      // Handle different geometry types
      if (feature.geometry.type === 'LineString') {
        // Handle LineString geometry (common in coastline data)
        const coords = feature.geometry.coordinates as number[][]
        if (Array.isArray(coords) && coords.length > 2) {
          // Treat LineString as coastline points
          for (let i = 0; i < coords.length - 1; i++) {
            const [lon1, lat1] = coords[i]
            const [lon2, lat2] = coords[i + 1]

            // Skip invalid coordinates
            if (typeof lon1 !== 'number' || typeof lat1 !== 'number') continue

            // Add points along the line segment
            const steps = 3 // Optimized for performance
            for (let j = 0; j <= steps; j++) {
              const t = j / steps
              const lon = lon1 + t * (lon2 - lon1)
              const lat = lat1 + t * (lat2 - lat1)

              const vec = lonLatToVector3(lon, lat, 5.015, is3D)
              positions.push(vec.x, vec.y, vec.z)
            }
          }
        }
        return // Skip the polygon processing for LineString
      } else if (feature.geometry.type === 'MultiLineString') {
        // Handle MultiLineString geometry
        const multiCoords = feature.geometry.coordinates as number[][][]
        if (Array.isArray(multiCoords)) {
          multiCoords.forEach((lineCoords) => {
            if (Array.isArray(lineCoords) && lineCoords.length > 1) {
              for (let i = 0; i < lineCoords.length - 1; i++) {
                const [lon1, lat1] = lineCoords[i]
                const [lon2, lat2] = lineCoords[i + 1]

                // Skip invalid coordinates
                if (typeof lon1 !== 'number' || typeof lat1 !== 'number') continue

                // Add points along the line segment
                const steps = 2 // Optimized for performance
                for (let j = 0; j <= steps; j++) {
                  const t = j / steps
                  const lon = lon1 + t * (lon2 - lon1)
                  const lat = lat1 + t * (lat2 - lat1)

                  const vec = lonLatToVector3(lon, lat, 5.015, is3D)
                  positions.push(vec.x, vec.y, vec.z)
                }
              }
            }
          })
        }
        return // Skip the polygon processing for MultiLineString
      } else if (feature.geometry.type === 'Polygon') {
        const coordinatesArray = [feature.geometry.coordinates]
        // Process polygons normally
        coordinatesArray.forEach((polygon: GeoJSONCoordinate[][]) => {
          if (!Array.isArray(polygon) || polygon.length === 0) return
          
          const outerRing = polygon[0]
          if (!Array.isArray(outerRing) || outerRing.length < 3) return

          // Create points along the polygon outline
          for (let i = 0; i < outerRing.length - 1; i++) {
            const [lon1, lat1] = outerRing[i]
            const [lon2, lat2] = outerRing[i + 1] || outerRing[0]

            const steps = 5
            for (let j = 0; j <= steps; j++) {
              const t = j / steps
              const lon = lon1 + t * (lon2 - lon1)
              const lat = lat1 + t * (lat2 - lat1)

              const vec = lonLatToVector3(lon, lat, 5.015, is3D)
              positions.push(vec.x, vec.y, vec.z)
            }
          }
        })
      } else if (feature.geometry.type === 'MultiPolygon') {
        const coordinatesArray = feature.geometry.coordinates
        // Process multi-polygons normally
        coordinatesArray.forEach((polygon: GeoJSONCoordinate[][]) => {
          if (!Array.isArray(polygon) || polygon.length === 0) return
          
          const outerRing = polygon[0]
          if (!Array.isArray(outerRing) || outerRing.length < 3) return

          // Create points along the polygon outline
          for (let i = 0; i < outerRing.length - 1; i++) {
            const [lon1, lat1] = outerRing[i]
            const [lon2, lat2] = outerRing[i + 1] || outerRing[0]

            const steps = 5
            for (let j = 0; j <= steps; j++) {
              const t = j / steps
              const lon = lon1 + t * (lon2 - lon1)
              const lat = lat1 + t * (lat2 - lat1)

              const vec = lonLatToVector3(lon, lat, 5.015, is3D)
              positions.push(vec.x, vec.y, vec.z)
            }
          }
        })
      }
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
      <pointsMaterial 
        color={is3D ? '#66ff66' : '#88ff88'} 
        size={is3D ? 0.08 : 0.15} 
        sizeAttenuation={!is3D} 
      />
    </points>
  )
}
'use client'

import * as THREE from 'three'
import { useMemo, useState, useEffect } from 'react'
import { lonLatToVector3 } from './LandMasses'

interface FloatPosition {
  platform_id: number
  lat: number
  lon: number
  date: string
}

interface FloatDotsProps {
  apiBaseUrl?: string
  dotColor?: string
  dotSize?: number
  circleRadius?: number
  is3D?: boolean
}

export const FloatDots = ({
  apiBaseUrl = 'http://localhost:8000',
  dotColor = '#ffff00',
  dotSize = 0.1, // Changed from 0 to 2 - dots were invisible with size 0!
  circleRadius = 1,
  is3D = true,
}: FloatDotsProps) => {
  const [floatData, setFloatData] = useState<FloatPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFloatData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching all float positions in a single request...')

        // Define the geographic box for the whole world to get all floats initially
        const params = new URLSearchParams({
          min_lat: '-90',
          max_lat: '90',
          min_lon: '-180',
          max_lon: '180',
          limit: '5000', // Ask for up to 5000 floats
        })

        // --- THE CRITICAL CHANGE ---
        // Make ONE single API call to the efficient endpoint
        const response = await fetch(
          `${apiBaseUrl}/api/floats_in_box?${params}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch float positions: ${response.status}`)
        }

        const positions: FloatPosition[] = await response.json()
        console.log(`Successfully fetched ${positions.length} float positions.`)
        setFloatData(positions)
      } catch (err) {
        console.error('Failed to fetch float data:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to fetch float data'
        )
        setFloatData([])
      } finally {
        setLoading(false)
      }
    }

    fetchFloatData()
  }, [apiBaseUrl]) // This effect runs once on component mount

  // Create a circular texture for the points
  const circleTexture = useMemo(() => {
    // Use circleRadius to determine canvas size - larger radius = larger circles
    const canvasSize = Math.max(32, Math.min(128, circleRadius * 12)) // Scale canvas size based on circleRadius
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')

    if (ctx) {
      const center = canvasSize / 2
      const radius = center
      // Create a circular gradient
      const gradient = ctx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        radius
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasSize, canvasSize)
    }

    return new THREE.CanvasTexture(canvas)
  }, [circleRadius])

  // This useMemo hook for geometry - keep surface position constant
  const floatGeometry = useMemo(() => {
    if (!floatData.length) return null

    const positions: number[] = []
    floatData.forEach((float) => {
      const vec = lonLatToVector3(float.lon, float.lat, 5.02, is3D) // Pass is3D parameter
      positions.push(vec.x, vec.y, vec.z)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    return geometry
  }, [floatData, is3D]) // Add is3D to dependencies

  if (loading) return null // Or return a cool loading spinner component
  if (error) return null // Or return an error message component
  if (!floatGeometry) return null

  // The rendering part is already efficient for this number of dots.
  return (
    <points geometry={floatGeometry}>
      <pointsMaterial
        color={dotColor}
        size={dotSize} // Removed the multiplication - circleRadius should control texture, not size
        sizeAttenuation={true}
        transparent={true}
        alphaTest={0.5}
        map={circleTexture}
      />
    </points>
  )
}

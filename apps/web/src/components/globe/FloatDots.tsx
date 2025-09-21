'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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
  const [currentZoom, setCurrentZoom] = useState(1)

  const { camera } = useThree()
  const materialRef = useRef<THREE.PointsMaterial>(null)

  // Single function to calculate dot size based on zoom - DRY principle
  const calculateDotSize = (zoom: number) => {
    const ZOOM_SCALE_FACTOR = 120 // Single place to adjust zoom sensitivity
    return dotSize * (zoom / ZOOM_SCALE_FACTOR)
  }

  // Track zoom changes in real-time
  useFrame(() => {
    if (!is3D && camera instanceof THREE.OrthographicCamera) {
      const newZoom = camera.zoom
      if (newZoom !== currentZoom) {
        setCurrentZoom(newZoom)
        // Update material size directly for better performance
        // Higher zoom = closer = bigger dots, Lower zoom = farther = smaller dots
        if (materialRef.current) {
          materialRef.current.size = calculateDotSize(newZoom)
          materialRef.current.needsUpdate = true
        }
      }
    }
  })

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
      // Create a circular gradient
      const gradient = ctx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        center
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

  // Calculate initial size for 2D mode
  const initialDotSize = useMemo(() => {
    if (is3D) {
      return dotSize
    } else {
      // Initial size for 2D based on current zoom
      const orthoCam = camera as THREE.OrthographicCamera
      const zoom = orthoCam.zoom || 1
      return calculateDotSize(zoom)
    }
  }, [dotSize, is3D, camera])

  if (loading) return null
  if (error) return null
  if (!floatGeometry) return null

  return (
    <points geometry={floatGeometry}>
      <pointsMaterial
        ref={materialRef}
        color={dotColor}
        size={initialDotSize}
        sizeAttenuation={is3D}
        transparent={true}
        alphaTest={0.5}
        map={circleTexture}
      />
    </points>
  )
}

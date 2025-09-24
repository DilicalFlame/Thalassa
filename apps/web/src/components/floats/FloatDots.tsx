'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { lonLatToVector3 } from '../globe/LandMasses'

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
  onFloatClick: (platformId: number) => void
  selectedFloatId?: number | null
  year?: number // when provided, fetch latest positions for that year
  startDate?: string // inclusive range start (YYYY-MM-DD)
  endDate?: string // inclusive range end (YYYY-MM-DD)
  play?: boolean // animate through range
  speedMs?: number // milliseconds per frame
  onFrameFloat?: (fp: FloatPosition) => void
}

export const FloatDots = ({
  apiBaseUrl = 'http://localhost:8000',
  dotColor = '#ffff00',
  dotSize = 0.1,
  circleRadius = 1,
  is3D = true,
  onFloatClick,
  selectedFloatId = null,
  year = 2023,
  startDate,
  endDate,
  play = false,
  speedMs = 500,
  onFrameFloat,
}: FloatDotsProps) => {
  const [floatData, setFloatData] = useState<FloatPosition[]>([])
  const [rangeData, setRangeData] = useState<FloatPosition[]>([])
  const [frameIndex, setFrameIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(1)
  const [hoveredFloatId, setHoveredFloatId] = useState<number | null>(null) // Add hover state

  const { camera, raycaster, scene, pointer } = useThree()
  const unselectedPointsRef = useRef<THREE.Points>(null!)
  const selectedPointsRef = useRef<THREE.Points>(null!)
  const hoveredPointsRef = useRef<THREE.Points>(null!)
  const unselectedMaterialRef = useRef<THREE.PointsMaterial>(null)
  const selectedMaterialRef = useRef<THREE.PointsMaterial>(null)
  const hoveredMaterialRef = useRef<THREE.PointsMaterial>(null)

  const handleCanvasClick = () => {
    if (!floatData.length) return

    // Set a more precise threshold for point intersection
    raycaster.params.Points.threshold = 0.08 // Very small threshold for precise clicking

    // Update the raycaster with the camera and pointer position
    raycaster.setFromCamera(pointer, camera)

    // Test intersections with all objects in the scene to stop ray early
    const allIntersects = raycaster.intersectObjects(scene.children, true)

    // Filter to only point objects and get the closest one
    const pointIntersects = allIntersects.filter(
      (intersect) =>
        intersect.object === unselectedPointsRef.current ||
        intersect.object === selectedPointsRef.current ||
        intersect.object === hoveredPointsRef.current
    )

    if (pointIntersects.length > 0) {
      // Get the closest intersection
      const closestIntersection = pointIntersects[0]
      const pointIndex = closestIntersection.index

      if (pointIndex !== undefined) {
        // Determine which object was clicked and find the corresponding float
        let clickedFloat: FloatPosition | null = null

        if (closestIntersection.object === unselectedPointsRef.current) {
          clickedFloat = unselectedFloats[pointIndex]
        } else if (closestIntersection.object === selectedPointsRef.current) {
          clickedFloat = selectedFloats[pointIndex]
        } else if (closestIntersection.object === hoveredPointsRef.current) {
          clickedFloat = hoveredFloats[pointIndex]
        }

        if (clickedFloat) {
          console.log('Clicked on float:', clickedFloat.platform_id)
          onFloatClick(clickedFloat.platform_id)
        }
      }
    }
  }

  // Single function to calculate dot size based on zoom - DRY principle
  const calculateDotSize = useCallback(
    (zoom: number) => {
      const ZOOM_SCALE_FACTOR = 120
      return dotSize * (zoom / ZOOM_SCALE_FACTOR)
    },
    [dotSize]
  )

  // Track zoom changes and handle hover detection in real-time
  useFrame(() => {
    // Handle zoom changes for 2D mode
    if (!is3D && camera instanceof THREE.OrthographicCamera) {
      const newZoom = camera.zoom
      if (newZoom !== currentZoom) {
        setCurrentZoom(newZoom)
        const newSize = calculateDotSize(newZoom)
        // Update material size directly for better performance
        if (unselectedMaterialRef.current) {
          unselectedMaterialRef.current.size = newSize
          unselectedMaterialRef.current.needsUpdate = true
        }
        if (selectedMaterialRef.current) {
          selectedMaterialRef.current.size = newSize * 1.5
          selectedMaterialRef.current.needsUpdate = true
        }
        if (hoveredMaterialRef.current) {
          // In 2D mode, hovered floats should keep the same size as unselected, only color changes
          hoveredMaterialRef.current.size = newSize
          hoveredMaterialRef.current.needsUpdate = true
        }
      }
    }

    // Handle hover detection with improved logic
    if (floatData.length) {
      raycaster.params.Points.threshold = is3D ? 0.05 : 0.1 // Smaller threshold for 3D to reduce conflicts
      raycaster.setFromCamera(pointer, camera)

      // First check if we're over any scene objects (like land masses)
      const allIntersects = raycaster.intersectObjects(scene.children, true)

      // Filter to only point objects
      const pointIntersects = allIntersects.filter(
        (intersect) =>
          intersect.object === unselectedPointsRef.current ||
          intersect.object === selectedPointsRef.current ||
          intersect.object === hoveredPointsRef.current
      )

      if (pointIntersects.length > 0) {
        const closestIntersection = pointIntersects[0]
        const pointIndex = closestIntersection.index

        if (pointIndex !== undefined) {
          let newHoveredFloat: FloatPosition | null = null

          if (closestIntersection.object === unselectedPointsRef.current) {
            newHoveredFloat = unselectedFloats[pointIndex]
          } else if (closestIntersection.object === selectedPointsRef.current) {
            newHoveredFloat = selectedFloats[pointIndex]
          } else if (closestIntersection.object === hoveredPointsRef.current) {
            newHoveredFloat = hoveredFloats[pointIndex]
          }

          // Only update hover state if it's different and not already selected
          if (
            newHoveredFloat &&
            newHoveredFloat.platform_id !== hoveredFloatId &&
            newHoveredFloat.platform_id !== selectedFloatId
          ) {
            setHoveredFloatId(newHoveredFloat.platform_id)
          }
        }
      } else {
        // No point intersection, clear hover
        if (hoveredFloatId !== null) {
          setHoveredFloatId(null)
        }
      }
    }

    // Ensure hovered material always has correct size in 2D mode (fix for zoom size issue)
    if (
      !is3D &&
      hoveredMaterialRef.current &&
      camera instanceof THREE.OrthographicCamera
    ) {
      const currentSize = calculateDotSize(camera.zoom)
      if (hoveredMaterialRef.current.size !== currentSize) {
        hoveredMaterialRef.current.size = currentSize
        hoveredMaterialRef.current.needsUpdate = true
      }
    }
  })

  // Fetch latest positions for a single year when no range specified
  useEffect(() => {
    if (startDate && endDate) return // handled by range effect
    let abort = false
    const fetchYearData = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          min_lat: '-90',
          max_lat: '90',
          min_lon: '-180',
          max_lon: '180',
          limit: '5000',
          year: String(year),
        })
        const res = await fetch(`${apiBaseUrl}/api/floats_in_box?${params}`)
        if (!res.ok) throw new Error(`Failed to fetch year ${year}`)
        const data: FloatPosition[] = await res.json()
        if (!abort) {
          setFloatData(data)
          setRangeData([])
        }
      } catch (e) {
        if (!abort) {
          setError(e instanceof Error ? e.message : 'Failed to fetch data')
          setFloatData([])
        }
      } finally {
        if (!abort) setLoading(false)
      }
    }
    fetchYearData()
    return () => {
      abort = true
    }
  }, [apiBaseUrl, year, startDate, endDate])

  // Fetch range data when both startDate & endDate present
  useEffect(() => {
    if (!startDate || !endDate) return
    let abort = false
    const fetchRangeData = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          min_lat: '-90',
          max_lat: '90',
          min_lon: '-180',
          max_lon: '180',
          start_date: startDate,
          end_date: endDate,
        })
        const res = await fetch(
          `${apiBaseUrl}/api/floats_in_box/range?${params}`
        )
        if (!res.ok) throw new Error('Failed to fetch range data')
        const payload = await res.json()
        const positions: FloatPosition[] = payload.positions || []
        if (!abort) {
          setRangeData(positions)
          setFloatData([])
          setFrameIndex(positions.length ? positions.length - 1 : 0) // initialize at last frame
        }
      } catch (e) {
        if (!abort) {
          setError(
            e instanceof Error ? e.message : 'Failed to fetch range data'
          )
          setRangeData([])
        }
      } finally {
        if (!abort) setLoading(false)
      }
    }
    fetchRangeData()
    return () => {
      abort = true
    }
  }, [apiBaseUrl, startDate, endDate])

  // Animation loop for range playback
  useEffect(() => {
    if (!play || !rangeData.length) return
    const interval = setInterval(() => {
      setFrameIndex((idx) => {
        const next = (idx + 1) % rangeData.length
        const fp = rangeData[next]
        if (fp && onFrameFloat) onFrameFloat(fp)
        return next
      })
    }, speedMs)
    return () => clearInterval(interval)
  }, [play, rangeData, speedMs, onFrameFloat])

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

  // Split floats into selected, hovered, and unselected for different coloring
  const { selectedFloats, hoveredFloats, unselectedFloats } = useMemo(() => {
    // Decide which dataset to visualize: latest snapshot (floatData) or progressive rangeData up to frameIndex
    let active: FloatPosition[] = []
    if (rangeData.length) {
      // Show cumulative positions up to current frame (inclusive)
      active = rangeData.slice(0, Math.min(frameIndex + 1, rangeData.length))
    } else {
      active = floatData
    }
    if (!active.length)
      return { selectedFloats: [], hoveredFloats: [], unselectedFloats: [] }

    const selected: FloatPosition[] = []
    const hovered: FloatPosition[] = []
    const unselected: FloatPosition[] = []

    active.forEach((float) => {
      if (float.platform_id === selectedFloatId) {
        selected.push(float)
      } else if (float.platform_id === hoveredFloatId) {
        hovered.push(float)
      } else {
        unselected.push(float)
      }
    })

    return {
      selectedFloats: selected,
      hoveredFloats: hovered,
      unselectedFloats: unselected,
    }
  }, [floatData, rangeData, frameIndex, selectedFloatId, hoveredFloatId])

  // Create separate geometries for selected and unselected floats
  const unselectedGeometry = useMemo(() => {
    if (!unselectedFloats.length) return null

    const positions: number[] = []
    unselectedFloats.forEach((float) => {
      const vec = lonLatToVector3(float.lon, float.lat, 5.02, is3D)
      positions.push(vec.x, vec.y, vec.z)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    return geometry
  }, [unselectedFloats, is3D])

  const selectedGeometry = useMemo(() => {
    if (!selectedFloats.length) return null

    const positions: number[] = []
    selectedFloats.forEach((float) => {
      const vec = lonLatToVector3(float.lon, float.lat, 5.02, is3D)
      positions.push(vec.x, vec.y, vec.z)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    return geometry
  }, [selectedFloats, is3D])

  const hoveredGeometry = useMemo(() => {
    if (!hoveredFloats.length) return null

    const positions: number[] = []
    hoveredFloats.forEach((float) => {
      const vec = lonLatToVector3(float.lon, float.lat, 5.02, is3D)
      positions.push(vec.x, vec.y, vec.z)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    return geometry
  }, [hoveredFloats, is3D])

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
  }, [dotSize, is3D, camera, calculateDotSize])

  if (loading) return null
  if (error) return null
  if (!unselectedGeometry && !selectedGeometry && !hoveredGeometry) return null

  return (
    <>
      {unselectedGeometry && (
        <points
          ref={unselectedPointsRef}
          geometry={unselectedGeometry}
          onClick={handleCanvasClick}
        >
          <pointsMaterial
            ref={unselectedMaterialRef}
            color={dotColor}
            size={initialDotSize}
            sizeAttenuation={is3D}
            transparent={true}
            alphaTest={0.5}
            map={circleTexture}
          />
        </points>
      )}
      {hoveredGeometry && (
        <points
          ref={hoveredPointsRef}
          geometry={hoveredGeometry}
          onClick={handleCanvasClick}
        >
          <pointsMaterial
            ref={hoveredMaterialRef}
            color='#ff6600' // Orange color for hovered floats
            size={is3D ? initialDotSize * 1.3 : initialDotSize} // Only increase size in 3D mode
            sizeAttenuation={is3D}
            transparent={true}
            alphaTest={0.5}
            map={circleTexture}
          />
        </points>
      )}
      {selectedGeometry && (
        <points
          ref={selectedPointsRef}
          geometry={selectedGeometry}
          onClick={handleCanvasClick}
        >
          <pointsMaterial
            ref={selectedMaterialRef}
            color='#8a2be2' // Violet color for selected floats
            size={initialDotSize * 1.5} // Larger size for selected floats
            sizeAttenuation={is3D}
            transparent={true}
            alphaTest={0.5}
            map={circleTexture}
          />
        </points>
      )}
    </>
  )
}

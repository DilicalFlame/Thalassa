'use client'

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lonLatToVector3 } from './globe/LandMasses'

interface CameraFocusProps {
  lat: number | null
  lon: number | null
  active: boolean
  is3D: boolean
  /** Notifies parent when focus animation starts */
  onFocusStart?: () => void
  /** Notifies parent when focus animation ends */
  onFocusEnd?: () => void
}

/** Smoothly flies camera toward a target lat/lon on globe when active. */
export const CameraFocus = ({
  lat,
  lon,
  active,
  is3D,
  onFocusStart,
  onFocusEnd,
}: CameraFocusProps) => {
  const { camera } = useThree()

  // Refs storing animation state
  const animatingRef = useRef(false)
  const startPosRef = useRef(new THREE.Vector3())
  const startQuatRef = useRef(new THREE.Quaternion())
  const targetPosRef = useRef(new THREE.Vector3())
  const targetQuatRef = useRef(new THREE.Quaternion())
  const tRef = useRef(0) // 0..1 progress

  /**
   * Tunable constants
   * FOCUS_DISTANCE : How far from the globe center the camera settles (affects zoom level)
   * LATERAL_SHIFT  : Horizontal offset so the selected float sits left while dossier panel shows right
   * DURATION       : Animation duration in seconds
   * EASE_POWER     : Easing exponent for easeOut (1 linear, 2 quad, 3 cubic, 4 quart...)
   * Increase LATERAL_SHIFT if the float is not far enough left when dossier is open.
   */
  const FOCUS_DISTANCE = 9
  // Lateral shift relative to local tangent to bias float toward left of screen
  const LATERAL_SHIFT = 0.9
  const DURATION = 1.15
  const EASE_POWER = 3

  /** Compute focus target when a float is (re)selected */
  useEffect(() => {
    if (!active || lat == null || lon == null || !is3D) {
      animatingRef.current = false
      return
    }
    animatingRef.current = true
    tRef.current = 0
    startPosRef.current.copy(camera.position)
    camera.getWorldQuaternion(startQuatRef.current)
    onFocusStart?.()

    // Position slightly to the side so dossier panel (right side) has space
    const surface = lonLatToVector3(lon, lat, 5.02, true)
    const normal = surface.clone().normalize()
    const worldUp = new THREE.Vector3(0, 1, 0)
    // Stable side vector: project global +X direction on plane perpendicular to normal
    const globalRight = new THREE.Vector3(1, 0, 0)
    const side = globalRight
      .clone()
      .sub(normal.clone().multiplyScalar(globalRight.dot(normal))) // remove normal component
    if (side.lengthSq() < 1e-6) {
      // Fallback to cross method if degenerate (pointing near poles aligned with +X)
      side.copy(new THREE.Vector3().crossVectors(normal, worldUp))
    }
    side.normalize()
    const camPos = normal
      .clone()
      .multiplyScalar(FOCUS_DISTANCE)
      .add(side.multiplyScalar(LATERAL_SHIFT))
    targetPosRef.current.copy(camPos)

    const lookAt = surface.clone()
    const m = new THREE.Matrix4().lookAt(
      targetPosRef.current,
      lookAt,
      new THREE.Vector3(0, 1, 0)
    )
    targetQuatRef.current.setFromRotationMatrix(m)

    if (process.env.NODE_ENV !== 'production') {
      console.log('[CameraFocus] targeting float', {
        lat,
        lon,
        target: targetPosRef.current.toArray(),
      })
    }
  }, [active, lat, lon, is3D, camera, onFocusStart])

  /** Per-frame interpolation */
  useFrame((_, delta) => {
    if (!animatingRef.current) return
    // Advance progress
    const duration = Math.max(0.1, DURATION)
    tRef.current = Math.min(1, tRef.current + delta / duration)
    // Ease-out (cubic by default)
    const t = tRef.current
    const eased = 1 - Math.pow(1 - t, EASE_POWER)

    // Lerp position & slerp rotation
    camera.position.lerpVectors(
      startPosRef.current,
      targetPosRef.current,
      eased
    )
    camera.quaternion.slerpQuaternions(
      startQuatRef.current,
      targetQuatRef.current,
      eased
    )

    if (tRef.current >= 1) {
      // Snap exactly to target & stop updating
      camera.position.copy(targetPosRef.current)
      camera.quaternion.copy(targetQuatRef.current)
      animatingRef.current = false
      onFocusEnd?.()
    }
  })

  return null
}

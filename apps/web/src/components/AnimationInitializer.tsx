'use client'

import { useEffect } from 'react'

export function AnimationInitializer() {
  useEffect(() => {
    // Dynamically import and initialize the animation system
    import('@/lib/animationSystem').then(({ initializeAnimationSystem }) => {
      initializeAnimationSystem()
    })
  }, [])

  // This component doesn't render anything
  return null
}

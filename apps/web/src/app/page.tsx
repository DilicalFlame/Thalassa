'use client'

import dynamic from 'next/dynamic'
import { usePageTransition } from '@/hooks/useAnimations'
import AnimatedLoader from '@/components/AnimatedLoader'

// Dynamically import the MapViewer component with SSR disabled
const MapViewer = dynamic(
  () => import('../components/MapViewer').then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#050505',
        }}
      >
        <AnimatedLoader
          message='Loading Map Viewer'
          type='typing'
          color='#00ff00'
        />
      </div>
    ),
  }
)

export default function HomePage() {
  const pageRef = usePageTransition<HTMLElement>()

  return (
    <main ref={pageRef}>
      <MapViewer />
    </main>
  )
}

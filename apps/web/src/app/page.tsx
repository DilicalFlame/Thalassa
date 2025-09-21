'use client'

import dynamic from 'next/dynamic'

// Dynamically import the MapViewer component with SSR disabled
const MapViewer = dynamic(
  () => import('../components/flatmap/MapViewer').then((mod) => mod.MapViewer),
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
          color: '#00ff00',
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        Loading Map Viewer...
      </div>
    ),
  }
)

export default function HomePage() {
  return (
    <main>
      <MapViewer />
    </main>
  )
}

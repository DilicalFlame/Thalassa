'use client'

import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import '@/styles/dossier.css'

interface DossierProps {
  platformId: number
  onClose: () => void
}

interface DossierDataPoint {
  date: string
  depth_m: number
  temp_c: number
  sal_psu: number
}

export const FloatDossier = ({ platformId, onClose }: DossierProps) => {
  const [data, setData] = useState<DossierDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `http://localhost:8000/api/float/${platformId}/dossier`
        )
        console.log(response, platformId)
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching dossier data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData().then((_) => {})
  }, [platformId])

  return (
    <div className='dossier-overlay'>
      <div className='dossier-content'>
        <button className='dossier-close' onClick={onClose}>
          ×
        </button>
        <h2>Float Dossier: {platformId}</h2>
        {loading ? (
          <p>Loading chart data...</p>
        ) : (
          <Plot
            data={[
              {
                x: data.map((d) => d.temp_c),
                y: data.map((d) => d.depth_m),
                z: data.map((d) => new Date(d.date).getTime()), // Use numeric time for Z axis
                mode: 'markers',
                type: 'scatter3d',
                marker: {
                  color: data.map((d) => d.depth_m), // Color by depth
                  colorscale: 'Viridis',
                  reversescale: true,
                  size: 4,
                  colorbar: {
                    title: {
                      text: 'Depth (m)',
                    },
                  },
                },
              },
            ]}
            layout={{
              title: {
                text: '3D Temperature Profile Over Time',
              },
              width: 700,
              height: 500,
              margin: { l: 0, r: 0, b: 0, t: 40 },
              scene: {
                xaxis: { title: { text: 'Temperature (°C)' } },
                yaxis: { title: { text: 'Depth (m)' }, autorange: 'reversed' },
                zaxis: {
                  title: { text: 'Time' },
                  tickformat: '%Y-%m-%d', // Format ticks as dates
                },
              },
            }}
          />
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import '@/styles/dossier.css'
import { useScaleIn, useHoverScale } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'

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

interface PathDataPoint {
  date: string
  lat: number
  lon: number
}

type ChartType =
  | '3d_temperature_profile'
  | '3d_salinity_profile'
  | '3d_temperature_timeseries'
  | '3d_salinity_timeseries'
  | '3d_ts_diagram'
  | '3d_trajectory'
  | '3d_tsd_profile'

export const FloatDossier = ({ platformId, onClose }: DossierProps) => {
  const [data, setData] = useState<DossierDataPoint[]>([])
  const [pathData, setPathData] = useState<PathDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<ChartType>(
    '3d_temperature_profile'
  )

  const dossierRef = useScaleIn<HTMLDivElement>(0)
  const closeButtonRef = useHoverScale<HTMLButtonElement>(1.1)

  const handleClose = () => {
    hapticUtils.modalClose()
    onClose()
  }

  const handleChartChange = (chartType: ChartType) => {
    hapticUtils.itemSelect()
    setActiveChart(chartType)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch dossier data (temperature, salinity, depth over time)
        const dossierResponse = await fetch(
          `http://localhost:8000/api/float/${platformId}/dossier`
        )
        const dossierResult = await dossierResponse.json()
        setData(dossierResult)

        // Fetch path data (trajectory coordinates)
        const pathResponse = await fetch(
          `http://localhost:8000/api/float/${platformId}/path`
        )
        const pathResult = await pathResponse.json()
        setPathData(pathResult)
      } catch (error) {
        console.error('Error fetching dossier data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [platformId])

  // Helper function to calculate days since first measurement
  const getDaysSinceFirst = (dateStr: string, firstDate: Date) => {
    return (
      (new Date(dateStr).getTime() - firstDate.getTime()) /
      (1000 * 60 * 60 * 24)
    )
  }

  // Get first date for relative time calculation
  const firstDate = data.length > 0 ? new Date(data[0].date) : new Date()
  const firstPathDate =
    pathData.length > 0 ? new Date(pathData[0].date) : new Date()

  // Filter out invalid data points
  const validData = data.filter(
    (d) =>
      d.temp_c != null &&
      d.sal_psu != null &&
      d.depth_m != null &&
      !isNaN(d.temp_c) &&
      !isNaN(d.sal_psu) &&
      !isNaN(d.depth_m)
  )
  const validPathData = pathData.filter(
    (d) => d.lat != null && d.lon != null && !isNaN(d.lat) && !isNaN(d.lon)
  )

  // Chart configurations
  const chartConfigs = {
    '3d_temperature_profile': {
      title: '3D Temperature Profile Over Time',
      data: [
        {
          x: validData.map((d) => d.temp_c),
          y: validData.map((d) => d.depth_m),
          z: validData.map((d) => getDaysSinceFirst(d.date, firstDate)),
          mode: 'markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validData.map((d) => d.depth_m),
            colorscale: 'Viridis',
            reversescale: true,
            size: 4,
            colorbar: { title: { text: 'Depth (m)' } },
          },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Temperature (°C)' } },
          yaxis: {
            title: { text: 'Depth (m)' },
            autorange: 'reversed' as const,
          },
          zaxis: { title: { text: 'Time (days since first measurement)' } },
        },
      },
    },

    '3d_salinity_profile': {
      title: '3D Salinity Profile Over Time',
      data: [
        {
          x: validData.map((d) => d.sal_psu),
          y: validData.map((d) => d.depth_m),
          z: validData.map((d) => getDaysSinceFirst(d.date, firstDate)),
          mode: 'markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validData.map((d) => d.depth_m),
            colorscale: 'Plasma',
            reversescale: true,
            size: 4,
            colorbar: { title: { text: 'Depth (m)' } },
          },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Salinity (PSU)' } },
          yaxis: {
            title: { text: 'Depth (m)' },
            autorange: 'reversed' as const,
          },
          zaxis: { title: { text: 'Time (days since first measurement)' } },
        },
      },
    },

    '3d_temperature_timeseries': {
      title: '3D Temperature Time Series',
      data: [
        {
          x: validData.map((d) => getDaysSinceFirst(d.date, firstDate)),
          y: validData.map((d) => d.temp_c),
          z: validData.map((d) => d.depth_m),
          mode: 'markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validData.map((d) => d.depth_m),
            colorscale: 'Coolwarm',
            size: 4,
            colorbar: { title: { text: 'Depth (m)' } },
          },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Time (days since first measurement)' } },
          yaxis: { title: { text: 'Temperature (°C)' } },
          zaxis: {
            title: { text: 'Depth (m)' },
            autorange: 'reversed' as const,
          },
        },
      },
    },

    '3d_salinity_timeseries': {
      title: '3D Salinity Time Series',
      data: [
        {
          x: validData.map((d) => getDaysSinceFirst(d.date, firstDate)),
          y: validData.map((d) => d.sal_psu),
          z: validData.map((d) => d.temp_c),
          mode: 'markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validData.map((d) => d.depth_m),
            colorscale: 'Viridis',
            size: 4,
            colorbar: { title: { text: 'Depth (m)' } },
          },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Time (days since first measurement)' } },
          yaxis: { title: { text: 'Salinity (PSU)' } },
          zaxis: { title: { text: 'Temperature (°C)' } },
        },
      },
    },

    '3d_ts_diagram': {
      title: '3D T-S Diagram',
      data: [
        {
          x: validData.map((d) => d.sal_psu),
          y: validData.map((d) => d.temp_c),
          z: validData.map((d) => d.depth_m),
          mode: 'markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validData.map((d) => d.depth_m),
            colorscale: 'Viridis',
            reversescale: true,
            size: 5,
            colorbar: { title: { text: 'Depth (m)' } },
          },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Salinity (PSU)' } },
          yaxis: { title: { text: 'Temperature (°C)' } },
          zaxis: {
            title: { text: 'Depth (m)' },
            autorange: 'reversed' as const,
          },
        },
      },
    },

    '3d_trajectory': {
      title: '3D Trajectory',
      data: [
        {
          x: validPathData.map((d) => d.lon),
          y: validPathData.map((d) => d.lat),
          z: validPathData.map((d) => getDaysSinceFirst(d.date, firstPathDate)),
          mode: 'lines+markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validPathData.map((d) =>
              getDaysSinceFirst(d.date, firstPathDate)
            ),
            colorscale: 'Plasma',
            size: 5,
            colorbar: { title: { text: 'Time (days)' } },
          },
          line: { color: '#fff', width: 2 },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Longitude' } },
          yaxis: { title: { text: 'Latitude' } },
          zaxis: { title: { text: 'Time (days since first measurement)' } },
        },
      },
    },

    '3d_tsd_profile': {
      title: '3D T-S-D Profile',
      data: [
        {
          x: validData.map((d) => d.sal_psu),
          y: validData.map((d) => d.temp_c),
          z: validData.map((d) => d.depth_m),
          mode: 'markers' as const,
          type: 'scatter3d' as const,
          marker: {
            color: validData.map((d) => d.depth_m),
            colorscale: 'Viridis',
            reversescale: true,
            size: 4,
            colorbar: { title: { text: 'Depth (m)' } },
          },
        },
      ],
      layout: {
        scene: {
          xaxis: { title: { text: 'Salinity (PSU)' } },
          yaxis: { title: { text: 'Temperature (°C)' } },
          zaxis: {
            title: { text: 'Depth (m)' },
            autorange: 'reversed' as const,
          },
        },
      },
    },
  }

  const currentChart = chartConfigs[activeChart]

  return (
    <div className='dossier-overlay'>
      <div ref={dossierRef} className='dossier-content'>
        <button
          ref={closeButtonRef}
          className='dossier-close'
          onClick={handleClose}
        >
          ×
        </button>
        <h2>Float Dossier: {platformId}</h2>

        {loading ? (
          <div className='loading-container'>
            <p>Loading chart data...</p>
          </div>
        ) : validData.length === 0 ? (
          <div className='loading-container'>
            <p>No valid data available for this float.</p>
          </div>
        ) : (
          <>
            <div className='chart-tabs'>
              <button
                className={`tab-button ${activeChart === '3d_temperature_profile' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_temperature_profile')}
              >
                3D Temp Profile
              </button>
              <button
                className={`tab-button ${activeChart === '3d_salinity_profile' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_salinity_profile')}
              >
                3D Sal Profile
              </button>
              <button
                className={`tab-button ${activeChart === '3d_temperature_timeseries' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_temperature_timeseries')}
              >
                3D Temp Series
              </button>
              <button
                className={`tab-button ${activeChart === '3d_salinity_timeseries' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_salinity_timeseries')}
              >
                3D Sal Series
              </button>
              <button
                className={`tab-button ${activeChart === '3d_ts_diagram' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_ts_diagram')}
              >
                3D T-S Diagram
              </button>
              <button
                className={`tab-button ${activeChart === '3d_trajectory' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_trajectory')}
              >
                3D Trajectory
              </button>
              <button
                className={`tab-button ${activeChart === '3d_tsd_profile' ? 'active' : ''}`}
                onClick={() => handleChartChange('3d_tsd_profile')}
              >
                3D T-S-D
              </button>
            </div>

            <div className='chart-container'>
              <Plot
                data={currentChart.data}
                layout={{
                  title: { text: currentChart.title },
                  width: 900,
                  height: 600,
                  margin: { l: 50, r: 50, b: 50, t: 50 },
                  paper_bgcolor: '#1e1e1e',
                  plot_bgcolor: '#1e1e1e',
                  font: { color: '#f0f0f0' },
                  ...currentChart.layout,
                }}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
                }}
              />
            </div>

            <div className='chart-info'>
              <p>
                Valid data points: {validData.length} | Path points:{' '}
                {validPathData.length} | First measurement:{' '}
                {firstDate.toLocaleDateString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

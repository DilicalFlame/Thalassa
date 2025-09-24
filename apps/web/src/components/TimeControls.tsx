'use client'

import { useState, useEffect } from 'react'

type Mode = 'year' | 'range'

interface TimeControlsProps {
  years?: number[]
  onYearChange?: (year: number) => void
  onRangeChange?: (start: string, end: string) => void
  onPlayToggle?: (playing: boolean) => void
  onSpeedChange?: (msPerFrame: number) => void
  initialYear?: number
}

/**
 * Simple overlay UI to switch between viewing a single year's latest positions
 * or animating positions across a date range.
 */
export const TimeControls = ({
  years = [2022, 2023, 2024],
  onYearChange,
  onRangeChange,
  onPlayToggle,
  onSpeedChange,
  initialYear = 2023,
}: TimeControlsProps) => {
  const [mode, setMode] = useState<Mode>('year')
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [startDate, setStartDate] = useState(`${initialYear}-01-01`)
  const [endDate, setEndDate] = useState(`${initialYear}-12-31`)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(500) // ms per frame

  useEffect(() => {
    if (mode === 'year') {
      onYearChange?.(selectedYear)
    } else {
      onRangeChange?.(startDate, endDate)
    }
  }, [mode, selectedYear, startDate, endDate, onRangeChange, onYearChange])

  const togglePlay = () => {
    const next = !isPlaying
    setIsPlaying(next)
    onPlayToggle?.(next)
  }

  const handleSpeedChange = (val: number) => {
    setSpeed(val)
    onSpeedChange?.(val)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: 12,
        background: 'rgba(0,0,0,0.55)',
        padding: '10px 14px',
        borderRadius: 8,
        fontFamily: 'system-ui, sans-serif',
        color: '#eee',
        fontSize: 12,
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        maxWidth: 260,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => setMode('year')}
          style={buttonStyle(mode === 'year')}
        >
          Year
        </button>
        <button
          onClick={() => setMode('range')}
          style={buttonStyle(mode === 'range')}
        >
          Range
        </button>
      </div>

      {mode === 'year' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ opacity: 0.8 }}>Select Year</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                const yr = parseInt(e.target.value, 10)
                setSelectedYear(yr)
              }}
              style={selectStyle}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {mode === 'range' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ opacity: 0.8 }}>Start Date</span>
            <input
              type='date'
              value={startDate}
              min={`2022-01-01`}
              max={`2024-12-31`}
              onChange={(e) => setStartDate(e.target.value)}
              style={selectStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ opacity: 0.8 }}>End Date</span>
            <input
              type='date'
              value={endDate}
              min={startDate}
              max={`2024-12-31`}
              onChange={(e) => setEndDate(e.target.value)}
              style={selectStyle}
            />
          </label>
          <button onClick={togglePlay} style={buttonStyle(isPlaying)}>
            {isPlaying ? 'Pause Animation' : 'Play Animation'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ opacity: 0.8 }}>
              Speed ({(1000 / speed).toFixed(0)} fps)
            </span>
            <input
              type='range'
              min={10} /* 100 fps */
              max={2000} /* 0.5 fps */
              step={10}
              value={speed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                opacity: 0.7,
              }}
            >
              <span>100 fps</span>
              <span>0.5 fps</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const buttonStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#1673ff' : 'rgba(255,255,255,0.1)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: 0.5,
})

const selectStyle: React.CSSProperties = {
  background: 'rgba(20,20,20,0.7)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 4,
  padding: '4px 6px',
  fontSize: 12,
}

export default TimeControls

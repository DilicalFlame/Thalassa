import '@/styles/view-toggle.css'
import { useFadeIn, useHoverScale } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'

interface ViewToggleProps {
  is3D: boolean
  setIs3D: (is3D: boolean) => void
}

export const ViewToggle = ({ is3D, setIs3D }: ViewToggleProps) => {
  const containerRef = useFadeIn<HTMLDivElement>(0.4, 'up')
  const button2DRef = useHoverScale<HTMLButtonElement>(1.05)
  const button3DRef = useHoverScale<HTMLButtonElement>(1.05)

  const handleViewToggle = (newIs3D: boolean) => {
    hapticUtils.viewToggle()
    setIs3D(newIs3D)
  }

  return (
    <div ref={containerRef} className='view-toggle-container'>
      <div className='view-toggle-capsule'>
        <button
          ref={button2DRef}
          className={!is3D ? 'active' : ''}
          onClick={() => handleViewToggle(false)}
        >
          2D
        </button>
        <button
          ref={button3DRef}
          className={is3D ? 'active' : ''}
          onClick={() => handleViewToggle(true)}
        >
          3D
        </button>
      </div>
    </div>
  )
}

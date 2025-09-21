import '@/styles/view-toggle.css'

interface ViewToggleProps {
  is3D: boolean
  setIs3D: (is3D: boolean) => void
}

export const ViewToggle = ({ is3D, setIs3D }: ViewToggleProps) => {
  return (
    <div className='view-toggle-container'>
      <div className='view-toggle-capsule'>
        <button
          className={!is3D ? 'active' : ''}
          onClick={() => setIs3D(false)}
        >
          2D
        </button>
        <button className={is3D ? 'active' : ''} onClick={() => setIs3D(true)}>
          3D
        </button>
      </div>
    </div>
  )
}

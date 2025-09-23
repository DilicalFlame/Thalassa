'use client'

import { useTheme } from './ThemeProvider'
import { useHoverScale } from '@/hooks/useAnimations'

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme()
  const buttonRef = useHoverScale<HTMLButtonElement>(1.05)

  const handleToggle = () => {
    console.log('Toggle theme clicked, current theme:', theme)
    toggleTheme()

    // Fallback: directly toggle the dark class if the context fails
    setTimeout(() => {
      const isDark = document.documentElement.classList.contains('dark')
      console.log('Dark class present after toggle:', isDark)
    }, 100)
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className='relative z-10 inline-flex h-7 w-12 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-blue-600 dark:bg-white/10'
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className='sr-only'>
        {theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
      </span>
      {/* Sun Icon */}
      <svg
        className={`absolute left-1.5 h-3 w-3 text-yellow-500 transition-opacity ${
          theme === 'dark' ? 'opacity-0' : 'opacity-100'
        }`}
        fill='currentColor'
        viewBox='0 0 20 20'
      >
        <path
          fillRule='evenodd'
          d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z'
          clipRule='evenodd'
        />
      </svg>
      {/* Moon Icon */}
      <svg
        className={`absolute right-1.5 h-3 w-3 text-blue-300 transition-opacity ${
          theme === 'dark' ? 'opacity-100' : 'opacity-0'
        }`}
        fill='currentColor'
        viewBox='0 0 20 20'
      >
        <path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
      </svg>
    </button>
  )
}

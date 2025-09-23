'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFadeIn, useHoverScale } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'

export default function Navigation() {
  const pathname = usePathname()
  const navRef = useFadeIn<HTMLElement>(0.2, 'down')
  const mapButtonRef = useHoverScale<HTMLAnchorElement>(1.05)
  const chatButtonRef = useHoverScale<HTMLAnchorElement>(1.05)

  const handleNavClick = (type: 'map' | 'chat') => {
    // Trigger haptic feedback for navigation
    hapticUtils.buttonPress()
    // Page transition haptic will be triggered automatically
    setTimeout(() => hapticUtils.pageTransition(), 100)
  }

  return (
    <nav ref={navRef} className='fixed right-4 top-4 z-50'>
      <div className='flex space-x-2'>
        {pathname !== '/' && (
          <Link
            href='/'
            ref={mapButtonRef}
            onClick={() => handleNavClick('map')}
            className='inline-flex items-center rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-gray-800/80'
          >
            <svg
              className='mr-2 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z'
              />
            </svg>
            Map
          </Link>
        )}
        {pathname !== '/chat' && (
          <Link
            href='/chat'
            ref={chatButtonRef}
            onClick={() => handleNavClick('chat')}
            className='inline-flex items-center rounded-lg border border-blue-500 bg-blue-600/90 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-blue-500/90'
          >
            <svg
              className='mr-2 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
            Chat with AI
          </Link>
        )}
      </div>
    </nav>
  )
}

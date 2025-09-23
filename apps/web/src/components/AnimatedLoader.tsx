'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface AnimatedLoaderProps {
  message?: string
  type?: 'pulse' | 'spin' | 'wave' | 'typing'
  color?: string
}

export const AnimatedLoader = ({
  message = 'Loading...',
  type = 'pulse',
  color = '#00ff00',
}: AnimatedLoaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Entrance animation
    gsap.fromTo(
      container,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
    )

    let animation: gsap.core.Timeline | gsap.core.Tween | undefined

    switch (type) {
      case 'pulse':
        animation = gsap.to(container, {
          opacity: 0.3,
          duration: 0.8,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: -1,
        })
        break

      case 'spin':
        const spinner = container.querySelector('.loader-spinner')
        if (spinner) {
          animation = gsap.to(spinner, {
            rotation: 360,
            duration: 1,
            ease: 'none',
            repeat: -1,
          })
        }
        break

      case 'wave':
        const letters = container.querySelectorAll('.wave-letter')
        const tl = gsap.timeline({ repeat: -1 })
        letters.forEach((letter, index) => {
          tl.to(
            letter,
            {
              y: -10,
              duration: 0.3,
              ease: 'power2.out',
              yoyo: true,
              repeat: 1,
            },
            index * 0.1
          )
        })
        animation = tl
        break

      case 'typing':
        if (dotsRef.current) {
          const dots = dotsRef.current.children
          const tl2 = gsap.timeline({ repeat: -1 })

          Array.from(dots).forEach((dot, index) => {
            tl2
              .to(
                dot,
                {
                  opacity: 1,
                  duration: 0.3,
                  ease: 'power2.out',
                },
                index * 0.2
              )
              .to(
                dot,
                {
                  opacity: 0.3,
                  duration: 0.3,
                  ease: 'power2.in',
                },
                index * 0.2 + 0.6
              )
          })
          animation = tl2
        }
        break
    }

    return () => {
      if (animation) {
        animation.kill()
      }
    }
  }, [type])

  const renderContent = () => {
    switch (type) {
      case 'spin':
        return (
          <>
            <div
              className='loader-spinner'
              style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${color}`,
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                marginRight: '12px',
              }}
            />
            <span style={{ color }}>{message}</span>
          </>
        )

      case 'wave':
        return (
          <span style={{ color }}>
            {message.split('').map((letter, index) => (
              <span
                key={index}
                className='wave-letter'
                style={{ display: 'inline-block' }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </span>
        )

      case 'typing':
        return (
          <span style={{ color }}>
            {message}
            <span ref={dotsRef} style={{ marginLeft: '4px' }}>
              <span style={{ opacity: 0.3 }}>.</span>
              <span style={{ opacity: 0.3 }}>.</span>
              <span style={{ opacity: 0.3 }}>.</span>
            </span>
          </span>
        )

      default: // pulse
        return <span style={{ color }}>{message}</span>
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '16px',
        fontWeight: 'bold',
      }}
    >
      {renderContent()}
    </div>
  )
}

export default AnimatedLoader

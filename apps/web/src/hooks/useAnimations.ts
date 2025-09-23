import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { RefObject } from 'react'

// Hook for fade in animations on mount
export const useFadeIn = <T extends HTMLElement = HTMLElement>(
    delay = 0,
    direction: 'up' | 'down' | 'left' | 'right' | 'none' = 'up'
) => {
    const ref = useRef<T>(null)

    useEffect(() => {
        if (ref.current) {
            const element = ref.current

            const fromProps: Record<string, number> = { opacity: 0 }

            switch (direction) {
                case 'up':
                    fromProps.y = 30
                    break
                case 'down':
                    fromProps.y = -30
                    break
                case 'left':
                    fromProps.x = -30
                    break
                case 'right':
                    fromProps.x = 30
                    break
                default:
                    break
            }

            gsap.fromTo(element, fromProps, {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                delay,
            })
        }
    }, [delay, direction])

    return ref
}

// Hook for scale in animations
export const useScaleIn = <T extends HTMLElement = HTMLElement>(delay = 0) => {
    const ref = useRef<T>(null)

    useEffect(() => {
        if (ref.current) {
            gsap.fromTo(
                ref.current,
                {
                    opacity: 0,
                    scale: 0.8,
                },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: 'back.out(1.7)',
                    delay,
                }
            )
        }
    }, [delay])

    return ref
}

// Hook for stagger animations on children
export const useStaggerChildren = <T extends HTMLElement = HTMLElement>(
    delay = 0,
    stagger = 0.1
) => {
    const ref = useRef<T>(null)

    useEffect(() => {
        if (ref.current) {
            const children = ref.current.children
            gsap.fromTo(
                children,
                {
                    opacity: 0,
                    y: 20,
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    stagger,
                    delay,
                }
            )
        }
    }, [delay, stagger])

    return ref
}

// Hook for hover animations
export const useHoverScale = <T extends HTMLElement = HTMLElement>(
    scale = 1.05
) => {
    const ref = useRef<T>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const onEnter = () => {
            gsap.to(element, {
                scale,
                duration: 0.2,
                ease: 'power2.out',
            })
        }

        const onLeave = () => {
            gsap.to(element, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out',
            })
        }

        element.addEventListener('mouseenter', onEnter)
        element.addEventListener('mouseleave', onLeave)

        return () => {
            element.removeEventListener('mouseenter', onEnter)
            element.removeEventListener('mouseleave', onLeave)
        }
    }, [scale])

    return ref
}

// Hook for hover lift effect
export const useHoverLift = (lift = -5) => {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const onEnter = () => {
            gsap.to(element, {
                y: lift,
                duration: 0.2,
                ease: 'power2.out',
            })
        }

        const onLeave = () => {
            gsap.to(element, {
                y: 0,
                duration: 0.2,
                ease: 'power2.out',
            })
        }

        element.addEventListener('mouseenter', onEnter)
        element.addEventListener('mouseleave', onLeave)

        return () => {
            element.removeEventListener('mouseenter', onEnter)
            element.removeEventListener('mouseleave', onLeave)
        }
    }, [lift])

    return ref
}

// Hook for page transitions
export const usePageTransition = <T extends HTMLElement = HTMLElement>() => {
    const ref = useRef<T>(null)

    useEffect(() => {
        if (ref.current) {
            gsap.fromTo(
                ref.current,
                {
                    opacity: 0,
                    scale: 0.95,
                },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                }
            )
        }
    }, [])

    return ref
}

// Hook for loading animations
export const useLoadingPulse = <T extends HTMLElement = HTMLElement>(
    isLoading: boolean
) => {
    const ref = useRef<T>(null)

    useEffect(() => {
        if (ref.current) {
            if (isLoading) {
                gsap.to(ref.current, {
                    opacity: 0.3,
                    duration: 0.6,
                    ease: 'power2.inOut',
                    yoyo: true,
                    repeat: -1,
                })
            } else {
                gsap.killTweensOf(ref.current)
                gsap.to(ref.current, {
                    opacity: 1,
                    duration: 0.3,
                })
            }
        }
    }, [isLoading])

    return ref
}

// Hook for scroll-triggered animations (requires intersection observer)
export const useScrollFadeIn = (threshold = 0.1) => {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        gsap.fromTo(
                            entry.target,
                            {
                                opacity: 0,
                                y: 30,
                            },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.6,
                                ease: 'power2.out',
                            }
                        )
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [threshold])

    return ref
}

// Custom hook for complex entrance animations
export const useEntranceAnimation = (
    ref: RefObject<HTMLElement>,
    animation: 'fadeInUp' | 'slideInLeft' | 'scaleIn' | 'rotateIn' = 'fadeInUp',
    delay = 0
) => {
    useEffect(() => {
        const element = ref.current
        if (!element) return

        switch (animation) {
            case 'fadeInUp':
                gsap.fromTo(
                    element,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        delay,
                    }
                )
                break
            case 'slideInLeft':
                gsap.fromTo(
                    element,
                    { opacity: 0, x: -50 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        delay,
                    }
                )
                break
            case 'scaleIn':
                gsap.fromTo(
                    element,
                    { opacity: 0, scale: 0.8 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        ease: 'back.out(1.7)',
                        delay,
                    }
                )
                break
            case 'rotateIn':
                gsap.fromTo(
                    element,
                    { opacity: 0, rotation: -10, scale: 0.9 },
                    {
                        opacity: 1,
                        rotation: 0,
                        scale: 1,
                        duration: 0.6,
                        ease: 'back.out(1.2)',
                        delay,
                    }
                )
                break
        }
    }, [animation, delay, ref])
}

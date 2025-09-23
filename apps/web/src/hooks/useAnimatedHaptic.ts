import { useCallback } from 'react'
import { gsap } from 'gsap'
import { hapticUtils, triggerHaptic, type HapticPattern } from '@/lib/haptics'

// Combined animation and haptic feedback hook
export const useAnimatedHaptic = () => {
    // Button press with haptic feedback and visual animation
    const animatedButtonPress = useCallback(
        (
            element: string | Element,
            hapticType: HapticPattern = 'medium',
            options?: {
                scale?: number
                duration?: number
                ease?: string
            }
        ) => {
            const config = {
                scale: 0.95,
                duration: 0.1,
                ease: 'power2.out',
                ...options,
            }

            // Trigger haptic feedback
            triggerHaptic(hapticType)

            // Create press animation
            const tl = gsap.timeline()
            tl.to(element, {
                scale: config.scale,
                duration: config.duration,
                ease: config.ease,
            }).to(element, {
                scale: 1,
                duration: config.duration * 1.5,
                ease: 'back.out(1.7)',
            })

            return tl
        },
        []
    )

    // Hover effect with subtle haptic feedback
    const animatedHover = useCallback(
        (
            element: string | Element,
            options?: {
                scale?: number
                hapticOnEnter?: boolean
                hapticType?: HapticPattern
            }
        ) => {
            const config = {
                scale: 1.05,
                hapticOnEnter: true,
                hapticType: 'light' as HapticPattern,
                ...options,
            }

            const el =
                typeof element === 'string'
                    ? document.querySelector(element)
                    : element
            if (!el) return

            const onEnter = () => {
                if (config.hapticOnEnter) {
                    triggerHaptic(config.hapticType)
                }
                gsap.to(el, {
                    scale: config.scale,
                    duration: 0.2,
                    ease: 'power2.out',
                })
            }

            const onLeave = () => {
                gsap.to(el, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out',
                })
            }

            el.addEventListener('mouseenter', onEnter)
            el.addEventListener('mouseleave', onLeave)

            return {
                destroy: () => {
                    el.removeEventListener('mouseenter', onEnter)
                    el.removeEventListener('mouseleave', onLeave)
                },
            }
        },
        []
    )

    // Notification animation with haptic feedback
    const animatedNotification = useCallback(
        (
            element: string | Element,
            type: 'success' | 'error' | 'warning' | 'info' = 'info',
            options?: {
                duration?: number
                hapticType?: HapticPattern
            }
        ) => {
            const hapticMap: Record<string, HapticPattern> = {
                success: 'success',
                error: 'error',
                warning: 'warning',
                info: 'notification',
            }

            const config = {
                duration: 0.5,
                hapticType: hapticMap[type],
                ...options,
            }

            // Trigger haptic feedback
            triggerHaptic(config.hapticType)

            // Create notification animation
            const tl = gsap.timeline()
            tl.fromTo(
                element,
                {
                    scale: 0.8,
                    opacity: 0,
                    y: -20,
                },
                {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    duration: config.duration,
                    ease: 'back.out(1.7)',
                }
            )
                .to(element, {
                    scale: 1.05,
                    duration: 0.1,
                    ease: 'power2.out',
                })
                .to(element, {
                    scale: 1,
                    duration: 0.1,
                    ease: 'power2.out',
                })

            return tl
        },
        []
    )

    // Toggle animation with haptic feedback
    const animatedToggle = useCallback(
        (
            element: string | Element,
            isOn: boolean,
            options?: {
                hapticType?: HapticPattern
                colorOn?: string
                colorOff?: string
            }
        ) => {
            const config = {
                hapticType: 'selection' as HapticPattern,
                colorOn: '#10b981',
                colorOff: '#6b7280',
                ...options,
            }

            // Trigger haptic feedback
            triggerHaptic(config.hapticType)

            // Create toggle animation
            const tl = gsap.timeline()
            tl.to(element, {
                scale: 0.9,
                duration: 0.1,
                ease: 'power2.out',
            }).to(element, {
                scale: 1,
                backgroundColor: isOn ? config.colorOn : config.colorOff,
                duration: 0.2,
                ease: 'back.out(1.7)',
            })

            return tl
        },
        []
    )

    // Drag start animation with haptic feedback
    const animatedDragStart = useCallback(
        (
            element: string | Element,
            options?: {
                scale?: number
                opacity?: number
                hapticType?: HapticPattern
            }
        ) => {
            const config = {
                scale: 1.1,
                opacity: 0.8,
                hapticType: 'medium' as HapticPattern,
                ...options,
            }

            // Trigger haptic feedback
            triggerHaptic(config.hapticType)

            // Create drag start animation
            return gsap.to(element, {
                scale: config.scale,
                opacity: config.opacity,
                duration: 0.2,
                ease: 'power2.out',
            })
        },
        []
    )

    // Drag end animation with haptic feedback
    const animatedDragEnd = useCallback(
        (
            element: string | Element,
            success: boolean = true,
            options?: {
                hapticType?: HapticPattern
            }
        ) => {
            const config = {
                hapticType: success ? 'impact' : ('warning' as HapticPattern),
                ...options,
            }

            // Trigger haptic feedback
            triggerHaptic(config.hapticType)

            // Create drag end animation
            const tl = gsap.timeline()

            if (success) {
                tl.to(element, {
                    scale: 1.05,
                    opacity: 1,
                    duration: 0.1,
                    ease: 'power2.out',
                }).to(element, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'back.out(1.7)',
                })
            } else {
                // Shake animation for failed drop
                tl.to(element, {
                    x: -5,
                    duration: 0.1,
                    ease: 'power2.out',
                })
                    .to(element, {
                        x: 5,
                        duration: 0.1,
                        ease: 'power2.out',
                    })
                    .to(element, {
                        x: 0,
                        scale: 1,
                        opacity: 1,
                        duration: 0.1,
                        ease: 'power2.out',
                    })
            }

            return tl
        },
        []
    )

    // Page transition with subtle haptic feedback
    const animatedPageTransition = useCallback(
        (element: string | Element, direction: 'in' | 'out' = 'in') => {
            // Light haptic for page transitions
            hapticUtils.pageTransition()

            if (direction === 'in') {
                return gsap.fromTo(
                    element,
                    {
                        opacity: 0,
                        scale: 0.95,
                        y: 20,
                    },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                    }
                )
            } else {
                return gsap.to(element, {
                    opacity: 0,
                    scale: 1.05,
                    y: -20,
                    duration: 0.4,
                    ease: 'power2.in',
                })
            }
        },
        []
    )

    return {
        animatedButtonPress,
        animatedHover,
        animatedNotification,
        animatedToggle,
        animatedDragStart,
        animatedDragEnd,
        animatedPageTransition,
        // Direct access to haptic utils
        haptics: hapticUtils,
        triggerHaptic,
    }
}

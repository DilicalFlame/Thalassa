# Animation System Documentation

## Overview
The Thalassa web application now includes a comprehensive GSAP-based animation system that provides subtle, performance-optimized animations throughout the interface.

## Key Features Added

### 1. Core Animation Utilities (`/src/lib/animations.ts`)
- **Presets**: `fadeInUp`, `fadeInLeft`, `fadeInRight`, `scaleIn`, `slideInFromTop`
- **Hover Effects**: `hoverScale`, `hoverLift`
- **Loading Animations**: `pulseLoader`, `spinLoader`
- **Page Transitions**: `pageTransitionIn`, `pageTransitionOut`
- **Stagger Animations**: `staggerChildren`

### 2. React Hooks (`/src/hooks/useAnimations.ts`)
- `useFadeIn` - Entrance animations with direction support
- `useScaleIn` - Scale-based entrance animations
- `useStaggerChildren` - Staggered animations for child elements
- `useHoverScale` / `useHoverLift` - Interactive hover effects
- `usePageTransition` - Page-level transition animations
- `useLoadingPulse` - Loading state animations
- `useScrollFadeIn` - Scroll-triggered animations

### 3. Enhanced Components

#### Navigation (`/src/components/Navigation.tsx`)
- **Entrance**: Slides down from top with subtle delay
- **Interactions**: Hover scale effects on navigation buttons
- **Timing**: 200ms fade-in delay, 1.05x hover scale

#### MapViewer (`/src/components/MapViewer.tsx`)
- **Loading**: Advanced wave-style loading animation
- **Container**: Subtle fade-in for the main viewport
- **Performance**: Optimized for 3D rendering context

#### Chat Interface (`/src/components/chat/`)
- **ChatInterface**: Scale-in welcome message, staggered container animations
- **ChatMessages**: Staggered message animations with fade-in empty states
- **ChatInput**: Slide-up entrance with hover effects on send button

#### ViewToggle (`/src/components/flatmap/ViewToggle.tsx`)
- **Entrance**: Fade-in from bottom with 400ms delay
- **Interactions**: Scale hover effects on 2D/3D buttons

#### FloatDossier (`/src/components/floats/FloatDossier.tsx`)
- **Modal**: Scale-in entrance animation
- **Close Button**: Enhanced hover scale effect

### 4. Advanced Loading Component (`/src/components/AnimatedLoader.tsx`)
Four different loading animation types:
- **Pulse**: Subtle opacity pulsing
- **Spin**: Rotating spinner with custom styling
- **Wave**: Letters animate in wave pattern
- **Typing**: Animated dots for typing indicator

### 5. Performance System (`/src/lib/animationSystem.ts`)

#### Optimizations
- **Hardware Acceleration**: Force 3D transforms for better performance
- **Device Detection**: Reduced animations on low-end devices
- **Accessibility**: Respects `prefers-reduced-motion` setting
- **Cleanup**: Automatic animation cleanup on page unload

#### Configuration
```typescript
const config = {
  duration: {
    fast: 0.2s,    // Quick interactions
    normal: 0.4s,  // Standard animations
    slow: 0.6s,    // Emphasis animations
    page: 0.8s     // Page transitions
  },
  stagger: {
    fast: 0.05s,   // Rapid sequences
    normal: 0.1s,  // Standard staggering
    slow: 0.2s     // Dramatic reveals
  }
}
```

## Animation Timing Strategy

### Entrance Animations
- **Navigation**: 200ms delay (appears after page content)
- **Page Content**: 0ms (immediate, serves as base)
- **Secondary Elements**: 300-600ms (builds hierarchy)

### Interactive Animations
- **Hover Effects**: 200ms duration (responsive feel)
- **Button Presses**: 150ms (immediate feedback)
- **Modal Appearances**: 400ms (draws attention)

### Loading States
- **Page Loads**: Wave/typing animations (engaging)
- **Component Loading**: Pulse/spin (subtle, non-intrusive)
- **Data Fetching**: Progress indicators with smooth transitions

## Performance Considerations

### Optimizations Implemented
1. **Hardware Acceleration**: All transforms use `force3D: true`
2. **Reduced Motion Support**: Respects user accessibility preferences
3. **Device-Aware**: Reduced complexity on low-end devices
4. **Cleanup**: Proper animation disposal to prevent memory leaks

### Performance Monitoring
- Monitor for animation frame drops
- Watch for memory usage spikes
- Test on various device capabilities

## Accessibility Features

### Reduced Motion Support
- Detects `prefers-reduced-motion: reduce`
- Automatically disables/speeds up animations
- Maintains functional behavior without motion

### Focus Management
- Animations don't interfere with keyboard navigation
- Hover effects complement focus states
- Screen reader compatible (animations are visual-only)

## Browser Compatibility

### Supported Browsers
- **Chrome/Edge**: Full support (latest 2 versions)
- **Firefox**: Full support (latest 2 versions)
- **Safari**: Full support (latest 2 versions)
- **Mobile**: Optimized performance on iOS/Android

### Fallbacks
- Graceful degradation for older browsers
- CSS transitions as fallback for unsupported features
- No JavaScript errors on unsupported features

## Troubleshooting

### Common Issues

1. **Animations Not Playing**
   - Check if `prefers-reduced-motion` is enabled
   - Verify GSAP initialization in layout
   - Ensure component refs are properly attached

2. **Performance Issues**
   - Monitor for excessive re-renders
   - Check for memory leaks in animation cleanup
   - Verify hardware acceleration is enabled

3. **TypeScript Errors**
   - Ensure proper generic types for refs
   - Check element type compatibility (HTMLElement vs HTMLDivElement)
   - Verify hook parameter types

### Debug Mode
Enable debug logging:
```typescript
gsap.config({ autoKillThreshold: 2 })
gsap.ticker.fps(60)
```

## Future Enhancements

### Potential Additions
1. **Scroll Animations**: Intersection Observer-based triggers
2. **Route Transitions**: Page-to-page animation continuity
3. **Gesture Support**: Touch-based interactions for mobile
4. **Theme Transitions**: Smooth dark/light mode switching
5. **Data Visualizations**: Animated chart transitions

### Monitoring
- Implement performance metrics for animation impact
- A/B testing for animation preferences
- User feedback collection on motion sensitivity

---

## Quick Reference

### Import Patterns
```typescript
// Hooks
import { useFadeIn, useHoverScale } from '@/hooks/useAnimations'

// Utilities
import { fadeInUp, scaleIn } from '@/lib/animations'

// Components
import AnimatedLoader from '@/components/AnimatedLoader'
```

### Common Usage
```typescript
// Basic fade-in
const ref = useFadeIn(0.2, 'up')

// Hover effect
const buttonRef = useHoverScale(1.05)

// Custom animation
useEffect(() => {
  fadeInUp('.my-element', 0.3)
}, [])
```

This animation system provides a solid foundation for enhancing user experience while maintaining performance and accessibility standards.
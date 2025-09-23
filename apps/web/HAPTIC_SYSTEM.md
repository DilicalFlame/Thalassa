# Haptic Feedback System

## Overview

The Thalassa web application features a comprehensive haptic feedback system that provides tactile responses to user interactions, enhancing the user experience particularly on mobile devices. The system combines visual GSAP animations with haptic feedback for a rich, multi-sensory interface.

## Architecture

### Core Components

1. **`src/lib/haptics.ts`** - Core haptic system with device detection and patterns
2. **`src/hooks/useAnimatedHaptic.ts`** - React hooks combining animations with haptics
3. **Component Integration** - Enhanced components with haptic feedback

### Haptic Patterns

The system supports 9 different haptic patterns:

- **`light`** - Subtle feedback (10ms vibration)
- **`medium`** - Standard feedback (20ms vibration)
- **`heavy`** - Strong feedback (50ms vibration)
- **`selection`** - Item selection (15ms vibration)
- **`impact`** - Action confirmation (30ms vibration)
- **`notification`** - Alert feedback (100-0-100ms pattern)
- **`success`** - Success confirmation (50-50-50ms pattern)
- **`warning`** - Warning alert (200-100-200ms pattern)
- **`error`** - Error feedback (100-100-100-100ms pattern)

### Device Support

#### iOS Devices (WebKit Haptic Engine)
- `impactLight` - Light impact feedback
- `impactMedium` - Medium impact feedback
- `impactHeavy` - Heavy impact feedback
- `notificationSuccess` - Success notification
- `notificationWarning` - Warning notification
- `notificationError` - Error notification
- `selectionChanged` - Selection change feedback

#### Android/Generic Devices (Vibration API)
- Uses `navigator.vibrate()` with custom patterns
- Fallback vibration patterns for unsupported devices

## Implementation

### Component Integration

#### Navigation (src/components/Navigation.tsx)
```typescript
const handleNavClick = (type: 'map' | 'chat') => {
  hapticUtils.buttonPress()     // Immediate button feedback
  setTimeout(() => hapticUtils.pageTransition(), 100) // Page transition
}
```

#### MapViewer (src/components/MapViewer.tsx)
```typescript
const handleFloatClick = (platformId: number) => {
  hapticUtils.floatSelect()     // Float selection feedback
  setSelectedFloatId(platformId)
}

const closeDossier = () => {
  hapticUtils.modalClose()      // Modal closing feedback
  setSelectedFloatId(null)
}
```

#### ViewToggle (src/components/flatmap/ViewToggle.tsx)
```typescript
const handleViewToggle = (newIs3D: boolean) => {
  hapticUtils.viewToggle()      // View switch feedback
  setIs3D(newIs3D)
}
```

#### ChatInterface (src/components/chat/ChatInterface.tsx)
```typescript
const sendMessage = async (message: string) => {
  hapticUtils.sendMessage()     // Send message feedback
  // ... send logic
  hapticUtils.receiveMessage()  // Receive response feedback
}

const createNewSession = async () => {
  hapticUtils.buttonPress()     // Button press feedback
  // ... creation logic
  hapticUtils.success()         // Success confirmation
}
```

#### FloatDossier (src/components/floats/FloatDossier.tsx)
```typescript
const handleClose = () => {
  hapticUtils.modalClose()      // Modal close feedback
  onClose()
}

const handleChartChange = (chartType: ChartType) => {
  hapticUtils.itemSelect()      // Chart selection feedback
  setActiveChart(chartType)
}
```

### Utility Functions

The `hapticUtils` object provides convenient access to common patterns:

```typescript
// UI Interactions
hapticUtils.buttonPress()      // Button presses
hapticUtils.buttonHover()      // Button hover states
hapticUtils.toggle()           // Toggle switches

// Navigation
hapticUtils.pageTransition()   // Page transitions
hapticUtils.modalOpen()        // Modal opening
hapticUtils.modalClose()       // Modal closing

// Data Interactions
hapticUtils.itemSelect()       // Item selection
hapticUtils.itemDelete()       // Item deletion
hapticUtils.dragStart()        // Drag operations
hapticUtils.dragEnd()          // Drop operations

// Feedback
hapticUtils.success()          // Success states
hapticUtils.error()            // Error states
hapticUtils.warning()          // Warning states
hapticUtils.notification()     // General notifications

// 3D/Map Interactions
hapticUtils.mapZoom()          // Map zoom operations
hapticUtils.floatSelect()      // Float selection
hapticUtils.viewToggle()       // View mode switching

// Chat Interactions
hapticUtils.sendMessage()      // Message sending
hapticUtils.receiveMessage()   // Message receiving
hapticUtils.typing()           // Typing indicators
```

## Configuration

### Haptic Settings

```typescript
interface HapticConfig {
  enabled: boolean                    // Global haptic enable/disable
  intensity: number                   // Intensity multiplier (0-100)
  respectsSystemSettings: boolean     // Honor reduced motion preferences
}
```

### Configuration Functions

```typescript
// Enable/disable haptics
enableHaptics()
disableHaptics()

// Set intensity (0-100)
setHapticIntensity(75)

// Update configuration
setHapticConfig({
  enabled: true,
  intensity: 80,
  respectsSystemSettings: true
})
```

## Accessibility

The haptic system respects accessibility preferences:

- **Reduced Motion**: Automatically disabled when `prefers-reduced-motion` is set
- **System Settings**: Honors device-level haptic preferences
- **Graceful Degradation**: Falls back silently on unsupported devices
- **No Dependencies**: Works without haptic support

## Performance

### Optimization Features

- **Device Detection**: Automatically selects optimal haptic method
- **Throttling**: Prevents excessive haptic calls
- **Lazy Loading**: Minimal performance impact when disabled
- **Error Handling**: Graceful fallbacks for API failures

### Best Practices

1. **Use Sparingly**: Only for important interactions
2. **Match Context**: Choose appropriate patterns for actions
3. **Test on Devices**: Different devices have varying haptic capabilities
4. **Respect Preferences**: Always honor user accessibility settings

## Browser Support

| Feature | iOS Safari | Android Chrome | Desktop |
|---------|------------|----------------|---------|
| WebKit Haptics | ✅ | ❌ | ❌ |
| Vibration API | ❌ | ✅ | ❌ |
| Graceful Fallback | ✅ | ✅ | ✅ |

## Testing

### Manual Testing

1. **iOS Device**: Test WebKit haptic patterns
2. **Android Device**: Test vibration patterns
3. **Desktop**: Ensure no errors or disruption
4. **Accessibility**: Test with reduced motion enabled

### Console Debugging

Enable debug logging:

```typescript
// Haptic system logs attempts and failures
console.debug('iOS haptic feedback failed:', error)
console.debug('Vibration API failed:', error)
```

## Future Enhancements

### Potential Additions

1. **Custom Patterns**: User-defined haptic patterns
2. **Adaptive Intensity**: Context-aware intensity adjustment
3. **Gesture Integration**: Haptic feedback for touch gestures
4. **Audio Synchronization**: Coordinate with sound effects
5. **Analytics**: Track haptic usage patterns

### Experimental Features

- **Spatial Haptics**: Direction-based feedback
- **Temporal Patterns**: Complex time-based sequences
- **Intensity Curves**: Dynamic intensity modulation

## Troubleshooting

### Common Issues

**No Haptic Feedback on iOS**
- Ensure device supports haptic feedback
- Check iOS version compatibility
- Verify user gesture has occurred (security requirement)

**Vibration Not Working on Android**
- Check browser permissions
- Verify Vibration API support
- Test with simple `navigator.vibrate(100)`

**Performance Issues**
- Reduce haptic calls frequency
- Check for memory leaks in event handlers
- Monitor console for error messages

### Debug Commands

```typescript
// Check support
console.log(isHapticSupported())

// Test patterns
hapticUtils.buttonPress()
hapticUtils.success()

// Check configuration
console.log(getHapticConfig())
```

## Integration Examples

### Adding Haptics to New Components

```typescript
import { hapticUtils } from '@/lib/haptics'

const MyComponent = () => {
  const handleClick = () => {
    hapticUtils.buttonPress()  // Add haptic feedback
    // ... existing logic
  }

  return <button onClick={handleClick}>Click Me</button>
}
```

### Custom Haptic Patterns

```typescript
import { triggerHaptic } from '@/lib/haptics'

const customInteraction = () => {
  triggerHaptic('medium')  // Use specific pattern
}
```

This haptic system enhances the Thalassa application's user experience by providing tactile feedback that complements the visual animations, creating a more engaging and responsive interface for oceanographic data exploration.
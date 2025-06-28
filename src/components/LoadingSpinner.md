# LoadingSpinner Component

A comprehensive, reusable loading spinner component that supports multiple variants, sizes, and customization options.

## Features

- **Multiple Variants**: 6 different spinner animations (default, clip, dots, pulse, ring, bars)
- **Customizable**: Size, color, text, and styling options
- **Responsive**: Automatically adjusts for mobile devices
- **Accessible**: Proper ARIA attributes and keyboard navigation support
- **Consistent**: Unified loading experience across the application

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | string | `"#ff008a"` | Color of the spinner |
| `size` | number | `50` | Size of the spinner in pixels |
| `variant` | string | `"default"` | Spinner variant: `"default"`, `"clip"`, `"dots"`, `"pulse"`, `"ring"`, `"bars"` |
| `text` | string | `""` | Optional text to display below the spinner |
| `fullScreen` | boolean | `false` | Whether to display as full screen loading |
| `className` | string | `""` | Additional CSS classes |
| `style` | object | `{}` | Additional inline styles |

## Variants

### Default/Clip
Uses the `react-spinners` ClipLoader component. Good for general loading states.

```jsx
<LoadingSpinner variant="default" color="#ff008a" />
```

### Dots
Three bouncing dots animation. Great for light, playful interfaces.

```jsx
<LoadingSpinner variant="dots" color="#ff008a" />
```

### Pulse
Pulsing circle animation. Good for attention-grabbing loading states.

```jsx
<LoadingSpinner variant="pulse" color="#ff008a" />
```

### Ring
Rotating ring animation. Classic loading spinner style.

```jsx
<LoadingSpinner variant="ring" color="#ff008a" />
```

### Bars
Animated bars. Good for data loading or processing states.

```jsx
<LoadingSpinner variant="bars" color="#ff008a" />
```

## Usage Examples

### Basic Loading
```jsx
import LoadingSpinner from '../components/LoadingSpinner';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingSpinner variant="ring" color="#ff008a" />;
  }

  return <div>Content loaded!</div>;
}
```

### With Loading Text
```jsx
<LoadingSpinner 
  variant="ring" 
  color="#ff008a" 
  text="Loading your content..." 
/>
```

### Button Loading State
```jsx
<button disabled={isLoading}>
  {isLoading ? (
    <div className="d-flex align-items-center">
      <LoadingSpinner variant="clip" color="white" size={16} />
      <span className="ms-2">Processing...</span>
    </div>
  ) : (
    'Submit'
  )}
</button>
```

### Full Screen Loading
```jsx
<LoadingSpinner 
  variant="ring" 
  color="#ff008a" 
  text="Loading application..." 
  fullScreen={true}
/>
```

### Custom Styling
```jsx
<LoadingSpinner 
  variant="pulse" 
  color="#007bff" 
  size={75}
  className="my-custom-spinner"
  style={{ marginTop: '20px' }}
/>
```

## Migration Guide

### From Custom Loading Spinners

**Before:**
```jsx
<div className="loading-spinner"></div>
<p>Loading...</p>
```

**After:**
```jsx
<LoadingSpinner variant="ring" text="Loading..." />
```

### From Bootstrap Spinners

**Before:**
```jsx
<span className="spinner-border spinner-border-sm text-light"></span>
```

**After:**
```jsx
<LoadingSpinner variant="clip" color="white" size={16} />
```

### From FontAwesome Spinners

**Before:**
```jsx
<i className="fas fa-spinner fa-spin"></i>
```

**After:**
```jsx
<LoadingSpinner variant="ring" />
```

## Best Practices

1. **Choose the right variant** for your use case:
   - Use `ring` for page/component loading
   - Use `clip` for button loading states
   - Use `dots` for light, playful interfaces
   - Use `pulse` for attention-grabbing states
   - Use `bars` for data processing

2. **Use appropriate colors**:
   - Primary brand color (`#ff008a`) for main loading states
   - White for buttons and overlays
   - Contextual colors for specific actions

3. **Provide meaningful text** for longer loading operations

4. **Use fullScreen prop** for application-level loading

5. **Keep sizes consistent** within your application:
   - 16px for buttons
   - 25px for small areas
   - 50px for standard loading
   - 75px for prominent loading

## Accessibility

The LoadingSpinner component includes:
- Proper ARIA attributes for screen readers
- Keyboard navigation support
- High contrast color options
- Responsive design for all devices

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- `react-spinners` (for clip variant)
- `prop-types` (for prop validation) 
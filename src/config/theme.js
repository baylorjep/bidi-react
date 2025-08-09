// Theme configuration
export const colors = {
    primary: '#ec4899',
    primaryHover: '#e91e89',
    white: '#ffffff',
    gray: {
        50: '#f9fafb',
        400: '#9ca3af',
        600: '#4b5563',
        700: '#374151'
    }
};

// You can add more theme-related configurations here
export const spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
};

export const borderRadius = {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px'
};

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
};

export const typography = {
    sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
    },
    weights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
    }
};

// Default theme object combining all theme properties
export const theme = {
    colors,
    spacing,
    borderRadius,
    shadows,
    typography
};

export default theme;

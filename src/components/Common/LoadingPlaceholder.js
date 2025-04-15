import React from 'react';
import '../../styles/LoadingPlaceholder.css';

const LoadingPlaceholder = ({ width, height, className }) => {
  return (
    <div 
      className={`loading-placeholder ${className || ''}`}
      style={{ 
        width: width || '100%',
        height: height || '100%',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
};

export default LoadingPlaceholder; 
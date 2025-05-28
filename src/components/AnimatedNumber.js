import React, { useState, useEffect } from 'react';
import '../styles/AnimatedNumber.css';

const AnimatedNumber = ({ value, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let loadingInterval;
    
    if (isLoading) {
      loadingInterval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 1000));
      }, 100);
    }

    if (value !== undefined) {
      clearInterval(loadingInterval);
      setIsLoading(false);
      setIsAnimating(true);
      const startTime = Date.now();
      const startValue = displayValue;
      const endValue = value;
      const range = endValue - startValue;

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(startValue + range * easeOutQuart);

        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }

    return () => {
      if (loadingInterval) {
        clearInterval(loadingInterval);
      }
    };
  }, [value, duration, isLoading]);

  return (
    <div className={`animated-number ${isAnimating ? 'animating' : ''} ${isLoading ? 'loading' : ''}`}>
      {displayValue.toLocaleString()}
    </div>
  );
};

export default AnimatedNumber; 
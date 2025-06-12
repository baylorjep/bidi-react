import React, { createContext, useEffect, useState } from 'react';
import { checkSupabaseHealth } from '../utils/checkSupabaseHealth';

export const SupabaseStatusContext = createContext();

export const SupabaseStatusProvider = ({ children }) => {
  const [isSupabaseUp, setIsSupabaseUp] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const runHealthCheck = async () => {
      try {
        const result = await checkSupabaseHealth();
        const now = new Date();
        setLastCheckTime(now);
        
        if (!result) {
          setErrorCount(prev => prev + 1);
          console.warn(`Supabase health check failed at ${now.toISOString()}. Error count: ${errorCount + 1}`);
        } else {
          setErrorCount(0);
        }
        
        setIsSupabaseUp(result);
      } catch (error) {
        console.error('Error running health check:', error);
        setIsSupabaseUp(false);
        setErrorCount(prev => prev + 1);
      }
    };

    runHealthCheck(); // run immediately
    const interval = setInterval(runHealthCheck, 60000); // then every 60 seconds
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [errorCount]);

  // Provide both the status and additional context
  const contextValue = {
    isSupabaseUp,
    lastCheckTime,
    errorCount,
    isDegraded: errorCount > 0 && errorCount < 3,
    isDown: errorCount >= 3
  };

  return (
    <SupabaseStatusContext.Provider value={contextValue}>
      {children}
    </SupabaseStatusContext.Provider>
  );
};
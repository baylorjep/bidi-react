import React, { createContext, useEffect, useState } from 'react';
import { checkSupabaseHealth } from '../utils/checkSupabaseHealth';

export const SupabaseStatusContext = createContext();

export const SupabaseStatusProvider = ({ children }) => {
  const [isSupabaseUp, setIsSupabaseUp] = useState(true);

  useEffect(() => {
    const runHealthCheck = async () => {
      const result = await checkSupabaseHealth();
      setIsSupabaseUp(result);
    };

    runHealthCheck(); // run immediately
    const interval = setInterval(runHealthCheck, 60000); // then every 60 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <SupabaseStatusContext.Provider value={{ isSupabaseUp }}>
      {children}
    </SupabaseStatusContext.Provider>
  );
};
import { useState, useEffect } from 'react';

export default function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const standalone = window.navigator.standalone === true;

    setIsIOS(isIosDevice);
    setIsInStandaloneMode(standalone);
  }, []);

  return { deferredPrompt, isIOS, isInStandaloneMode };
}
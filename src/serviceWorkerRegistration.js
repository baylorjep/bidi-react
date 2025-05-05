// serviceWorkerRegistration.js

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("ServiceWorker registration successful:", registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Service Worker update found!');
          
          newWorker.addEventListener('statechange', () => {
            console.log('Service Worker state:', newWorker.state);
          });
        });
      } catch (error) {
        console.error("ServiceWorker registration failed:", error);
        // Don't throw the error, just log it
      }
    });
  } else {
    console.log("Service workers are not supported in this browser");
  }
}

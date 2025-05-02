// serviceWorkerRegistration.js

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js") // path to your service worker file
        .then((registration) => {
          console.log("ServiceWorker registered: ", registration);
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed: ", error);
        });
    });
  }
}

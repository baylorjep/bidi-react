import heic2any from 'heic2any';

// Cache for converted images
const imageCache = new Map();

// Priority queue for image conversion
class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(item, priority) {
    this.queue.push({ item, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  dequeue() {
    return this.queue.shift()?.item;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

const conversionQueue = new PriorityQueue();
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || conversionQueue.isEmpty()) return;
  
  isProcessing = true;
  try {
    while (!conversionQueue.isEmpty()) {
      const { url, resolve, reject } = conversionQueue.dequeue();
      try {
        const result = await convertToWebP(url);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  } finally {
    isProcessing = false;
  }
};

export const convertHeicToJpeg = async (url) => {
  try {
    // Check if the URL is a HEIC image
    if (url.toLowerCase().match(/\.heic$/)) {
      // Fetch the HEIC image
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convert HEIC to JPEG
      const jpegBlob = await heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.8
      });

      // Create object URL for the converted image
      return URL.createObjectURL(jpegBlob);
    }
    
    return url;
  } catch (error) {
    console.error('Error converting HEIC image:', error);
    return url; // Return original URL if conversion fails
  }
};

export const convertToWebP = async (url) => {
  try {
    // Check cache first
    if (imageCache.has(url)) {
      return imageCache.get(url);
    }

    // Skip if already WebP or if it's a video
    if (url.toLowerCase().match(/\.webp$/) || url.toLowerCase().match(/\.(mp4|mov|wmv|avi|mkv)$/)) {
      return url;
    }

    // Return a promise that will be resolved when the conversion is complete
    return new Promise((resolve, reject) => {
      // Calculate priority based on viewport position
      const element = document.querySelector(`img[src="${url}"]`);
      const priority = element ? 
        (element.getBoundingClientRect().top < window.innerHeight ? 1 : 0) : 0;
      
      conversionQueue.enqueue({ url, resolve, reject }, priority);
      processQueue();
    });
  } catch (error) {
    console.error('Error converting to WebP:', error);
    return url; // Return original URL if conversion fails
  }
};

// Function to convert all images in a batch
export const convertImagesToWebP = async (imageUrls) => {
  const results = {};
  
  for (const url of imageUrls) {
    try {
      results[url] = await convertToWebP(url);
    } catch (error) {
      console.error(`Error converting image ${url}:`, error);
      results[url] = url; // Fallback to original URL
    }
  }
  
  return results;
};

// Function to clear the image cache
export const clearImageCache = () => {
  imageCache.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  imageCache.clear();
};

// Function to register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registration successful:', registration);
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
}; 
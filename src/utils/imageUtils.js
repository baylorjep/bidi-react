import heic2any from 'heic2any';

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
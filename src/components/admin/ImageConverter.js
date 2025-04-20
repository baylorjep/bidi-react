import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import '../../styles/ImageConverter.css';

const ImageConverter = () => {
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [currentImage, setCurrentImage] = useState('');
  const [error, setError] = useState(null);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const convertToWebP = async (imageUrl) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load image
      const img = await createImage(imageUrl);
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Convert to WebP
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert to WebP'));
              return;
            }
            resolve(blob);
          },
          'image/webp',
          0.90
        );
      });
    } catch (error) {
      console.error('Error converting image:', error);
      throw error;
    }
  };

  const handleConvertAll = async () => {
    try {
      setConverting(true);
      setError(null);
      setProgress(0);

      // Fetch all non-WebP images (excluding videos)
      const { data: images, error: fetchError } = await supabase
        .from('profile_photos')
        .select('id, photo_url, file_path')
        .not('photo_url', 'ilike', '%.webp')
        .not('photo_url', 'ilike', '%.mp4')
        .not('photo_url', 'ilike', '%.mov')
        .not('photo_url', 'ilike', '%.avi')
        .not('photo_url', 'ilike', '%.wmv')
        .not('photo_url', 'is', null);

      if (fetchError) throw fetchError;

      setTotalImages(images.length);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setCurrentImage(image.photo_url);
        
        try {
          // Skip if it's a video file
          if (image.photo_url.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/)) {
            console.log(`Skipping video file: ${image.photo_url}`);
            continue;
          }

          // Convert image to WebP
          const webpBlob = await convertToWebP(image.photo_url);
          
          // Generate new file path with .webp extension
          const oldPath = image.file_path;
          const newPath = oldPath.replace(/\.[^/.]+$/, '.webp');
          
          // Upload new WebP image
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(newPath, webpBlob, { upsert: true });
          
          if (uploadError) throw uploadError;
          
          // Get public URL of new image
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(newPath);
          
          // Update database record
          const { error: updateError } = await supabase
            .from('profile_photos')
            .update({ 
              photo_url: publicUrl,
              file_path: newPath
            })
            .eq('id', image.id);
          
          if (updateError) throw updateError;
          
          // Delete old image
          const { error: deleteError } = await supabase.storage
            .from('profile-photos')
            .remove([oldPath]);
          
          if (deleteError) throw deleteError;
          
          // Update progress
          setProgress(((i + 1) / images.length) * 100);
          
        } catch (error) {
          console.error(`Error processing image ${image.photo_url}:`, error);
          setError(`Failed to convert ${image.photo_url}: ${error.message}`);
          continue; // Continue with next image
        }
      }
      
      setCurrentImage('');
      alert('Conversion completed!');
      
    } catch (error) {
      console.error('Error in conversion process:', error);
      setError(error.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="image-converter-container">
      <h1>Image Converter</h1>
      <p>Convert all non-WebP images to WebP format</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <button 
        onClick={handleConvertAll}
        disabled={converting}
        className="convert-button"
      >
        {converting ? 'Converting...' : 'Convert All Images'}
      </button>
      
      {converting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {Math.round(progress)}% Complete
            {currentImage && (
              <div className="current-image">
                Processing: {currentImage.split('/').pop()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageConverter; 
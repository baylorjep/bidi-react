import React, { useState } from 'react';
import { batchConvertImages } from '../../utils/batchConvertImages';
import '../../styles/Admin.css';

const ImageConversion = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    try {
      console.log('Starting image conversion from admin page...');
      setStatus('converting');
      setError(null);
      setProgress(0);

      await batchConvertImages();
      
      console.log('Image conversion completed successfully');
      setStatus('completed');
      setProgress(100);
    } catch (error) {
      console.error('Error during image conversion:', error);
      setError(error.message || 'An error occurred during conversion');
      setStatus('error');
    }
  };

  return (
    <div className="admin-container">
      <h1>Image Conversion</h1>
      
      <div className="conversion-status">
        <h2>Status: {status}</h2>
        {error && <div className="error-message">{error}</div>}
        {status === 'converting' && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      <button 
        className="convert-button"
        onClick={handleConvert}
        disabled={status === 'converting'}
      >
        {status === 'converting' ? 'Converting...' : 'Convert Images'}
      </button>

      <div className="conversion-info">
        <h3>What this process does:</h3>
        <ul>
          <li>Finds all JPG, JPEG, PNG, and GIF images in the profile_photos bucket</li>
          <li>Converts them to WebP format with optimized quality</li>
          <li>Uploads the new WebP versions while preserving originals</li>
          <li>Updates database records to point to the new WebP files</li>
        </ul>

        <h3>Important Notes:</h3>
        <ul>
          <li>This process may take some time depending on the number of images</li>
          <li>Original images are preserved (not deleted)</li>
          <li>New WebP images are stored with the same name but .webp extension</li>
          <li>The process runs in batches of 10 images to avoid memory issues</li>
          <li>Progress is shown in the browser console for monitoring</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageConversion; 
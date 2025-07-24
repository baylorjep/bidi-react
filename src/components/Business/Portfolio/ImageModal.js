import React, { useEffect, useState } from "react";
// import Modal from "react-modal";
import { Modal } from "react-bootstrap";
import { convertHeicToJpeg } from "../../../utils/imageUtils";
import "../../../styles/ImageModal.css";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useNavigate } from "react-router-dom";

const ImageModal = ({ isOpen, mediaUrl, isVideo, onClose, categoryMedia = [], currentIndex = 0, businessId }) => {
  const [convertedUrls, setConvertedUrls] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ImageModal - useEffect triggered:', { isOpen, categoryMediaLength: categoryMedia.length });
    
    if (!isOpen) {
      console.log('ImageModal - Modal closed, cleaning up');
      setCurrentMedia(null);
      setIsReady(false);
      return;
    }

      const handleHeicImages = async () => {
    if (!categoryMedia.length) {
      console.log('ImageModal - No category media to process');
      setIsReady(true); // Mark as ready even if no media
      return;
    }
    
    console.log('ImageModal - Starting image conversion');
    setIsConverting(true);
    const converted = {};
    
    // Process images in parallel for faster loading
    const conversionPromises = categoryMedia.map(async (media) => {
      console.log('ImageModal - Processing media:', { url: media.url, type: media.type, isVideo: media.isVideo });
      // Check if it's a video (either by isVideo property or type property)
      const isVideo = media.isVideo || media.type === 'video';
      if (!isVideo && media.url && media.url.toLowerCase().match(/\.heic$/)) {
        try {
          const convertedUrl = await convertHeicToJpeg(media.url);
          console.log('ImageModal - Successfully converted HEIC image:', media.url);
          return { url: media.url, convertedUrl };
        } catch (error) {
          console.error('ImageModal - Error converting image:', error);
          return { url: media.url, convertedUrl: media.url };
        }
      } else {
        return { url: media.url, convertedUrl: media.url };
      }
    });
    
    try {
      const results = await Promise.all(conversionPromises);
      results.forEach(({ url, convertedUrl }) => {
        converted[url] = convertedUrl;
      });
      
      console.log('ImageModal - Finished converting images:', converted);
      setConvertedUrls(converted);
    } catch (error) {
      console.error('ImageModal - Error in batch conversion:', error);
      // Fallback: use original URLs
      categoryMedia.forEach(media => {
        converted[media.url] = media.url;
      });
      setConvertedUrls(converted);
    }
    
    setIsConverting(false);
    setIsReady(true);
  };

    handleHeicImages();

    // Cleanup function to revoke object URLs
    return () => {
      console.log('ImageModal - Cleanup function called');
      Object.values(convertedUrls).forEach(url => {
        if (url && url !== mediaUrl) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [categoryMedia, isOpen]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: currentIndex,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    lazyLoad: 'progressive',
    cssEase: 'linear',
    dotsClass: "slick-dots custom-dots",
    swipeToSlide: true,
    centerMode: false,
    centerPadding: '0px',
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: false,
          centerPadding: '0px',
          dots: true,
          infinite: true
        }
      }
    ],
    beforeChange: (oldIndex, newIndex) => {
      console.log('ImageModal - Slide changing:', { oldIndex, newIndex });
      // Pause all videos when changing slides
      const videos = document.querySelectorAll('.modal-media.video');
      videos.forEach(video => video.pause());
      // Reset zoom when changing slides
      setZoomLevel(1);
      setIsZoomed(false);
    },
    afterChange: (currentSlide) => {
      console.log('ImageModal - Slide changed to:', currentSlide);
      // Play the current video if it exists
      const currentVideo = document.querySelector('.slick-current .modal-media.video');
      if (currentVideo) {
        currentVideo.play().catch(console.error);
      }
    }
  };

  // Add a key to force slider re-render when currentIndex changes
  const sliderKey = `slider-${currentIndex}`;

  const handleViewGallery = () => {
    onClose();
    navigate(`/portfolio/${businessId}/gallery`);
  };

  // Zoom functionality
  const handleImageClick = (e) => {
    if (isZoomed) {
      // Reset zoom
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      // Zoom in
      setZoomLevel(2);
      setIsZoomed(true);
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    if (isZoomed) {
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      setZoomLevel(2);
      setIsZoomed(true);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Store initial distance for pinch gesture
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      e.target.dataset.initialDistance = distance;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const initialDistance = parseFloat(e.target.dataset.initialDistance || currentDistance);
      const scale = currentDistance / initialDistance;
      
      const newZoomLevel = Math.max(1, Math.min(3, scale));
      setZoomLevel(newZoomLevel);
      setIsZoomed(newZoomLevel > 1);
    }
  };

  const handleTouchEnd = () => {
    // Reset zoom if it's too small
    if (zoomLevel < 1.2) {
      setZoomLevel(1);
      setIsZoomed(false);
    }
  };

  // Add this style block
  const styles = `
    .modal-dialog {
      max-width: 100vw !important;
      max-height: 100vh !important;
      margin: 0 !important;
      height: 100vh !important;
    }
    .modal-content {
      height: 100vh !important;
      max-height: 100vh !important;
      border-radius: 0 !important;
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .modal-xl {
      max-width: 100vw !important;
      width: 100vw !important;
    }
    .modal-backdrop {
      background: rgba(0, 0, 0, 0.3) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
    }
    .slider-container {
      position: relative;
      min-height: 300px;
      height: 80vh;
      width: 100%;
      padding: 0 !important;
      overflow: hidden;
    }
    .modal-close-button {
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 1001;
      color: white;
      font-size: 28px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
    }
    .modal-close-button:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.5);
    }
    .custom-dots {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex !important;
      justify-content: center;
      align-items: center;
      padding: 0;
      margin: 0;
      list-style: none;
      z-index: 1000;
      border-radius: 20px;
      padding: 8px 16px;
    }
    .custom-dots li {
      margin: 0 4px;
    }
    .custom-dots li button {
      width: 8px;
      height: 8px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .custom-dots li.slick-active button {
      background: rgba(163, 40, 244, 0.9);
      transform: scale(1.2);
    }
    .modal-slide {
      position: relative;
      width: 100%;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 !important;
    }
    .image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      background: transparent !important;
    }
    .modal-media {
      max-height: 100vh;
      max-width: 100vw;
      width: auto;
      height: auto;
      object-fit: contain;
      transition: transform 0.3s ease;
      cursor: pointer;
    }
    
    .modal-media.zoomed {
      cursor: zoom-out;
    }
    
    .image-container.zoomed {
      overflow: auto;
      cursor: grab;
    }
    
    .image-container.zoomed:active {
      cursor: grabbing;
    }
    .modal-media.video {
      max-height: 100vh;
      max-width: 100vw;
      width: auto;
      height: auto;
      object-fit: contain;
      background: rgba(0, 0, 0, 0.8);
    }
    .video-container {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px) !important;
      -webkit-backdrop-filter: blur(5px) !important;
    }
    .slick-prev, .slick-next {
      z-index: 1000 !important;
    }
    .slick-prev:before, .slick-next:before {
      display: none;
    }
    .slick-prev, .slick-next {
      width: 40px !important;
      height: 40px !important;
    }
    .slick-prev {
      left: 10px !important;
    }
    .slick-next {
      right: 10px !important;
    }
    .view-gallery-button {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(163, 40, 244, 0.9);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      z-index: 1000;
      transition: all 0.2s ease;
    }
    .view-gallery-button:hover {
      background: rgba(163, 40, 244, 1);
      transform: translateX(-50%) scale(1.05);
    }

    /* Hide adjacent slides */
    .slick-slide:not(.slick-active) {
      opacity: 0;
      pointer-events: none;
    }
    .slick-list {
      overflow: hidden;
      padding: 0 !important;
    }
    .slick-track {
      display: flex;
      align-items: center;
    }
    
    /* Override any slick-carousel default padding */
    .slick-list,
    .slick-list * {
      padding: 0 !important;
      margin: 0 !important;
    }
    
    /* Prevent scrolling when modal is open */
    body.modal-open {
      overflow: hidden !important;
    }
    
    /* Ensure modal content doesn't scroll */
    .image-modal,
    .image-modal .modal-content,
    .image-modal .modal-body {
      overflow: hidden !important;
      max-height: 100vh !important;
    }
    
    /* Override Bootstrap modal padding */
    .image-modal .modal-body {
      padding: 0 !important;
    }
    
    .image-modal .modal-content {
      padding: 0 !important;
    }
    
    /* Override Bootstrap CSS variables for this modal */
    .image-modal {
      --bs-modal-padding: 0 !important;
      --bs-modal-header-padding-x: 0 !important;
      --bs-modal-header-padding-y: 0 !important;
      --bs-modal-header-padding: 0 !important;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .modal-media {
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
      
      .modal-media.zoomed {
        cursor: zoom-out;
      }
      
      .image-container.zoomed {
        overflow: auto;
        cursor: grab;
      }
      
      .image-container.zoomed:active {
        cursor: grabbing;
      }
      .slider-container {
        padding: 0;
        height: 100vh;
        width: 100%;
        overflow: hidden;
      }
      .modal-close-button {
        top: 10px;
        right: 10px;
        width: 35px;
        height: 35px;
        font-size: 24px;
      }
      .custom-dots {
        bottom: 10px;
        padding: 6px 12px;
      }
      .custom-dots li button {
        width: 6px;
        height: 6px;
      }
      .slick-prev, .slick-next {
        width: 35px !important;
        height: 35px !important;
      }
      .slick-prev {
        left: 5px !important;
      }
      .slick-next {
        right: 5px !important;
      }
      .modal-slide {
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
      }
      .slick-slide {
        width: 100vw !important;
        height: 100vh !important;
      }
      .slick-track {
        width: 100% !important;
        height: 100vh !important;
      }
      .slick-list {
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
      }
      .modal-media {
        max-height: 100vh;
        max-width: 100vw;
        width: auto;
        height: auto;
        object-fit: contain;
      }
      .modal-media.video {
        max-height: 100vh;
        max-width: 100vw;
        width: auto;
        height: auto;
        object-fit: contain;
        background: #000;
      }
      .video-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
      }
      .image-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        margin: 0;
      }
    }

    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .slider-container {
        padding: 0;
        height: 100vh;
        width: 100%;
        overflow: hidden;
      }
      .modal-close-button {
        top: 8px;
        right: 8px;
        width: 30px;
        height: 30px;
        font-size: 20px;
      }
      .custom-dots {
        bottom: 8px;
        padding: 4px 10px;
      }
      .custom-dots li button {
        width: 5px;
        height: 5px;
      }
      .slick-prev, .slick-next {
        width: 30px !important;
        height: 30px !important;
      }
      .slick-prev {
        left: 2px !important;
      }
      .slick-next {
        right: 2px !important;
      }
      .modal-slide {
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
      }
      .slick-slide {
        width: 100vw !important;
        height: 100vh !important;
      }
      .slick-track {
        width: 100% !important;
        height: 100vh !important;
      }
      .slick-list {
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
      }
      .modal-media {
        max-height: 100vh;
        max-width: 100vw;
        width: auto;
        height: auto;
        object-fit: contain;
      }
      .modal-media.video {
        max-height: 100vh;
        max-width: 100vw;
        width: auto;
        height: auto;
        object-fit: contain;
        background: #000;
      }
      .video-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
      }
      .image-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        margin: 0;
      }
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 2;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #A328F4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    .loading-overlay p {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
    }
  `;

  function SampleNextArrow(props) {
    const { className, style, onClick } = props;
    return (
      <button
        type="button"
        className={`${className} custom-arrow custom-next-arrow`}
        onClick={onClick}
        style={{ 
          ...style, 
          display: 'block',
          width: '40px', 
          height: '40px', 
          borderRadius: '40px', 
          background: 'rgba(163, 40, 244, 0.9)', 
          position: 'absolute', 
          top: '50%', 
          right: '20px',
          marginRight: '20px',
          transform: 'translateY(-50%)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          padding: 0,
          lineHeight: 1
        }}
      >
        <span style={{ color: '#fff', fontSize: '20px' }}>
          <i className="fas fa-chevron-right"></i>
        </span>
      </button>
    );
  }

  function SamplePrevArrow(props) {
    const { className, style, onClick } = props;
    return (
      <button
        type="button"
        className={`${className} custom-arrow custom-prev-arrow`}
        onClick={onClick}
        style={{ 
          ...style, 
          display: 'block',
          width: '40px', 
          height: '40px', 
          borderRadius: '40px', 
          background: 'rgba(163, 40, 244, 0.9)', 
          position: 'absolute', 
          top: '50%', 
          left: '20px', 
          marginLeft: '20px',
          transform: 'translateY(-50%)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          padding: 0,
          lineHeight: 1
        }}
      >
        <span style={{ color: '#fff', fontSize: '20px' }}>
          <i className="fas fa-chevron-left"></i>
        </span>
      </button>
    );
  }

  if (!isOpen) {
    return null;
  }

  // Show loading screen while preparing
  if (!isReady) {
    return (
      <Modal 
        show={isOpen} 
        onHide={onClose} 
        centered
        size="xl"
        className="image-modal image-modal-xl"
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          padding: 0,
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <style>{styles}</style>
        <div className="modal-close-button" onClick={onClose}>×</div>
        <Modal.Body className="image-modal-body" style={{ padding: 0, margin: 0, overflow: 'hidden' }}>
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Preparing images...</p>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  // Debug logs
  console.log('ImageModal - Rendering:', {
    categoryMedia,
    convertedUrls,
    currentIndex,
  });

  if (!categoryMedia.length) {
    return (
      <Modal show={isOpen} onHide={onClose} centered size="xl" className="image-modal image-modal-xl">
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className="image-modal-body" style={{ padding: 0 }}>
          <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>
            No media to display.
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      centered
      size="xl"
      className="image-modal image-modal-xl"
      onEntered={() => {
        console.log('ImageModal - Modal entered, setting current media');
        setCurrentMedia(categoryMedia[currentIndex]);
      }}
      style={{
        maxWidth: '100vw',
        maxHeight: '100vh',
        margin: 0,
        padding: 0,
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <style>{styles}</style>
      <div className="modal-close-button" onClick={onClose}>×</div>
      <Modal.Body className="image-modal-body" style={{ padding: 0, margin: 0, overflow: 'hidden' }}>
        {isConverting ? (
          <div className="converting-overlay">
            <div className="converting-spinner"></div>
            <p>Converting images...</p>
          </div>
        ) : (
          <div className="slider-container" style={{ 
            position: 'relative', 
            minHeight: '300px',
            padding: 0,
            height: '100vh',
            width: '100%',
            margin: 0,
            overflow: 'hidden'
          }}>
            <Slider {...settings} key={sliderKey}>
              {categoryMedia.map((media, index) => {
                // Check if it's a video (either by isVideo property or type property)
                const isVideo = media.isVideo || media.type === 'video';
                
                return (
                  <div key={index} className="modal-slide">
                    {isVideo ? (
                      <div className="video-container">
                        <video 
                          src={media.url} 
                          controls 
                          autoPlay={index === currentIndex}
                          className="modal-media video"
                          playsInline
                        />
                      </div>
                    ) : (
                      <div 
                        className={`image-container ${isZoomed ? 'zoomed' : ''}`}
                        style={{
                          width: '100%',
                          height: '100vh',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 0,
                          margin: 0,
                          overflow: isZoomed ? 'auto' : 'hidden'
                        }}
                      >
                        <img
                          src={convertedUrls[media.url] || media.url}
                          alt={`Media ${index + 1}`}
                          className={`modal-media ${isZoomed ? 'zoomed' : ''}`}
                          loading="lazy"
                          onClick={handleImageClick}
                          onDoubleClick={handleDoubleClick}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100vh',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center center',
                            transition: isZoomed ? 'none' : 'transform 0.3s ease'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </Slider>
            {categoryMedia.length === 5 && (
              <button 
                className="view-gallery-button"
                onClick={handleViewGallery}
              >
                View Full Gallery
              </button>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageModal;

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
        return;
      }
      
      console.log('ImageModal - Starting image conversion');
      setIsConverting(true);
      const converted = {};
      
      for (const media of categoryMedia) {
        console.log('ImageModal - Processing media:', { url: media.url, type: media.type });
        if (!media.isVideo && media.url && media.url.toLowerCase().match(/\.heic$/)) {
          try {
            converted[media.url] = await convertHeicToJpeg(media.url);
            console.log('ImageModal - Successfully converted HEIC image:', media.url);
          } catch (error) {
            console.error('ImageModal - Error converting image:', error);
            converted[media.url] = media.url;
          }
        } else {
          converted[media.url] = media.url;
        }
      }
      
      console.log('ImageModal - Finished converting images:', converted);
      setConvertedUrls(converted);
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
    beforeChange: (oldIndex, newIndex) => {
      console.log('ImageModal - Slide changing:', { oldIndex, newIndex });
      // Pause all videos when changing slides
      const videos = document.querySelectorAll('.modal-media.video');
      videos.forEach(video => video.pause());
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

  // Add this style block
  const styles = `
    .slider-container {
      position: relative;
      min-height: 300px;
      height: 80vh;
      width: 100%;
      background: #222 !important;
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
      background: rgba(0, 0, 0, 0.3);
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
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #222 !important;
      padding: 0 !important;
    }
    .image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: transparent !important;
    }
    .modal-media {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      background: transparent !important;
    }
    .video-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .modal-media.video {
      width: 100%;
      max-height: 80vh;
      object-fit: contain;
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
      bottom: 20px;
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
    }
    .slick-track {
      display: flex;
      align-items: center;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .slider-container {
        padding: 0;
        height: 100vh;
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
      .modal-media {
        max-height: 100vh;
        width: 100%;
        object-fit: contain;
      }
      .modal-media.video {
        max-height: 100vh;
        width: 100%;
        object-fit: contain;
      }
      .image-container {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .slider-container {
        padding: 0;
        height: 100vh;
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
      .modal-media {
        max-height: 100vh;
        width: 100%;
        object-fit: contain;
      }
      .modal-media.video {
        max-height: 100vh;
        width: 100%;
        object-fit: contain;
      }
      .image-container {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
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

  if (!isOpen || !isReady) {
    console.log('ImageModal - Not ready to render:', { isOpen, categoryMediaLength: categoryMedia.length, isReady });
    return null;
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
        margin: 0,
        padding: 0
      }}
    >
      <style>{styles}</style>
      <div className="modal-close-button" onClick={onClose}>×</div>
      <Modal.Body className="image-modal-body" style={{ padding: 0, margin: 0 }}>
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
            width: '100vw',
            margin: 0
          }}>
            <Slider {...settings} key={sliderKey}>
              {categoryMedia.map((media, index) => (
                <div key={index} className="modal-slide">
                  {media.type === 'video' ? (
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
                    <div className="image-container" style={{
                      width: '100%',
                      height: '100vh',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 0,
                      margin: 0
                    }}>
                      <img
                        src={convertedUrls[media.url] || media.url}
                        alt={`Media ${index + 1}`}
                        className="modal-media"
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100vh',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
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

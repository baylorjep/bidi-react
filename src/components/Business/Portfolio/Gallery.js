import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Gallery.css";
import ImageModal from "./ImageModal";
import { convertHeicToJpeg } from "../../../utils/imageUtils";
import LoadingPlaceholder from '../../Common/LoadingPlaceholder';
import ImageErrorBoundary from '../../Common/ImageErrorBoundary';
import EditGalleryModal from './EditGalleryModal';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Gallery = ({ businessId: propBusinessId, businessName: propBusinessName, isModal = false, onModalClose = null, onBackToPortfolio = null }) => {
  const { businessId: paramBusinessId, businessName: paramBusinessName } = useParams();
  const businessId = propBusinessId || paramBusinessId;
  const businessName = propBusinessName || paramBusinessName;
  const [portfolioMedia, setPortfolioMedia] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const navigate = useNavigate();
  const AUTO_PLAY_COUNT = 4; // Number of videos that will autoplay
  const [convertedUrls, setConvertedUrls] = useState({});
  const [convertingImages, setConvertingImages] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [scrollPositions, setScrollPositions] = useState({});
  const [error, setError] = useState(null);
  const [quickViewMedia, setQuickViewMedia] = useState(null);
  const [hoveredMedia, setHoveredMedia] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [videoVolumes, setVideoVolumes] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});
  const [isNavigating, setIsNavigating] = useState(false);

  // Initialize video volumes and muted states
  useEffect(() => {
    if (Object.keys(portfolioMedia).length > 0) {
      const volumes = {};
      const muted = {};
      Object.values(portfolioMedia).flat().forEach(media => {
        if (media.type === 'video') {
          volumes[media.url] = 0.5; // Default volume
          muted[media.url] = true; // Default muted
        }
      });
      setVideoVolumes(volumes);
      setMutedVideos(muted);
    }
  }, [portfolioMedia]);

  // Add debounced resize handler
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Cleanup navigation state on unmount
  useEffect(() => {
    return () => {
      setIsNavigating(false);
      setError(null);
    };
  }, []);

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: windowWidth >= 1200 ? 3 : windowWidth >= 768 ? 2 : 1,
    slidesToScroll: 1,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    dotsClass: "slick-dots custom-dots",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          centerMode: false,
          centerPadding: '0px'
        }
      }
    ],
    // Add these optimizations
    lazyLoad: 'progressive',
    waitForAnimate: true,
    swipeToSlide: true,
    touchThreshold: 10,
    adaptiveHeight: true,
    // Prevent unnecessary re-renders
    shouldComponentUpdate: true,
    // Optimize performance
    cssEase: 'linear',
    // Reduce resize observer notifications
    centerMode: false,
    centerPadding: '0px',
  };

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
          right: '10px', 
          transform: 'translateY(-50%)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 2
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
          left: '10px', 
          transform: 'translateY(-50%)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 2
        }}
      >
        <span style={{ color: '#fff', fontSize: '20px' }}>
          <i className="fas fa-chevron-left"></i>
        </span>
      </button>
    );
  }

  const fetchPortfolioMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      setImageLoading({}); // Reset loading states

      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("portfolio_categories")
        .select("id, name, display_order")
        .eq("business_id", businessId)
        .order("display_order", { ascending: true });

      if (categoriesError) {
        throw new Error("Failed to fetch categories");
      }

      // Fetch media items
      const { data: mediaData, error: mediaError } = await supabase
        .from("profile_photos")
        .select("*")
        .eq("user_id", businessId)
        .or("photo_type.eq.portfolio,photo_type.eq.video")
        .order("display_order", { ascending: true });

      if (mediaError) {
        throw new Error("Failed to fetch media items");
      }

      console.log('Fetched media data:', mediaData); // Debug log

      // Organize media by category
      const organizedMedia = {
        'all': [],
        'photos': []
      };

      // Initialize categories
      categoriesData.forEach((category) => {
        organizedMedia[category.id] = [];
      });

      // Process media items
      mediaData.forEach((item) => {
        // Skip items without a valid URL
        if (!item.photo_url && !item.file_path) {
          console.warn('Media item missing URL:', item);
          return;
        }

        const mediaItem = {
          url: item.photo_url || item.file_path,
          type: item.photo_type === "video" ? "video" : "image",
          category_id: item.category_id
        };
        
        console.log('Processing media item:', mediaItem);
        
        organizedMedia['all'].push(mediaItem);
        
        if (item.category_id) {
          if (!organizedMedia[item.category_id]) {
            organizedMedia[item.category_id] = [];
          }
          organizedMedia[item.category_id].push(mediaItem);
        } else {
          organizedMedia['photos'].push(mediaItem);
        }
      });

      console.log('Organized media:', organizedMedia);
      setCategories(categoriesData);
      setPortfolioMedia(organizedMedia);

      // Check if user is the business owner
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        setIsBusinessOwner(user.id === businessId);
      }
    } catch (err) {
      console.error("Error fetching portfolio media:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioMedia();
  }, [businessId]);

  useEffect(() => {
    const convertImages = async () => {
      const converted = {};
      const allMedia = Object.values(portfolioMedia).flat();
      for (const media of allMedia) {
        if (media.type === 'image') {
          // Skip if already WebP
          if (media.url.toLowerCase().endsWith('.webp')) {
            converted[media.url] = media.url;
            continue;
          }
          try {
            converted[media.url] = await convertHeicToJpeg(media.url);
          } catch (error) {
            console.error('Error converting image:', error);
            converted[media.url] = media.url; // Fallback to original URL
          }
        } else {
          converted[media.url] = media.url;
        }
      }
      setConvertedUrls(converted);
    };

    if (Object.keys(portfolioMedia).length > 0) {
      convertImages();
    }

    // Cleanup function
    return () => {
      Object.values(convertedUrls).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [portfolioMedia]);

  const handleMediaClick = (media, index) => {
    console.log('Gallery - handleMediaClick:', { media, index });
    
    // Get the current category media
    const currentCategoryMedia = selectedCategory === 'all' 
      ? Object.values(portfolioMedia).flat()
      : portfolioMedia[selectedCategory] || [];
    
    // Find the correct index in the current category media
    const correctIndex = currentCategoryMedia.findIndex(item => item.url === media.url);
    
    // Format media for ImageModal compatibility
    const formattedCategoryMedia = currentCategoryMedia.map(item => ({
      url: item.url,
      type: item.type,
      isVideo: item.type === 'video' // Add isVideo property for ImageModal
    }));
    
    console.log('Gallery - currentCategoryMedia:', currentCategoryMedia);
    console.log('Gallery - formattedCategoryMedia:', formattedCategoryMedia);
    console.log('Gallery - correctIndex:', correctIndex);

    // Ensure we have valid data before setting selected media
    if (formattedCategoryMedia.length === 0) {
      console.error('Gallery - No media to display in modal');
      return;
    }

    setSelectedMedia({
      url: media.url,
      isVideo: media.type === 'video',
      categoryMedia: formattedCategoryMedia,
      currentIndex: correctIndex >= 0 ? correctIndex : 0
    });
    console.log('Gallery - setSelectedMedia called with:', {
      url: media.url,
      isVideo: media.type === 'video',
      categoryMediaLength: formattedCategoryMedia.length,
      currentIndex: correctIndex >= 0 ? correctIndex : 0
    });
  };

  const handleCloseModal = () => {
    console.log('Gallery - handleCloseModal called');
    setSelectedMedia(null);
  };

  const scrollCarousel = (direction, categoryId) => {
    const container = document.querySelector(`#carousel-${categoryId} .carousel-track`);
    if (!container) return;

    const itemWidth = 280; // Width of carousel item
    const gap = 12; // Gap between items
    const scrollAmount = (itemWidth + gap) * 2; // Scroll 2 items at a time
    
    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    let newScrollPosition;
    if (direction === 'left') {
      newScrollPosition = Math.max(0, currentScroll - scrollAmount);
    } else {
      newScrollPosition = Math.min(maxScroll, currentScroll + scrollAmount);
    }

    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });

    // Update button visibility after scroll
    setTimeout(() => {
      const leftButton = container.parentElement.querySelector('.carousel-nav-button.left');
      const rightButton = container.parentElement.querySelector('.carousel-nav-button.right');
      
      if (leftButton && rightButton) {
        leftButton.style.display = container.scrollLeft > 0 ? 'flex' : 'none';
        rightButton.style.display = 
          container.scrollLeft < (container.scrollWidth - container.clientWidth - 10) ? 'flex' : 'none';
      }
    }, 300);
  };

  // Add this useEffect to handle scroll buttons visibility
  useEffect(() => {
    const updateScrollButtons = () => {
      const carousels = document.querySelectorAll('.carousel-track');
      carousels.forEach(carousel => {
        const container = carousel.parentElement;
        const leftButton = container.querySelector('.carousel-nav-button.left');
        const rightButton = container.querySelector('.carousel-nav-button.right');
        
        if (leftButton && rightButton) {
          leftButton.style.display = carousel.scrollLeft > 0 ? 'flex' : 'none';
          rightButton.style.display = 
            carousel.scrollLeft < (carousel.scrollWidth - carousel.clientWidth) ? 'flex' : 'none';
        }
      });
    };

    // Initial update
    updateScrollButtons();

    // Add scroll event listeners
    const carousels = document.querySelectorAll('.carousel-track');
    carousels.forEach(carousel => {
      carousel.addEventListener('scroll', updateScrollButtons);
    });

    // Cleanup
    return () => {
      carousels.forEach(carousel => {
        carousel.removeEventListener('scroll', updateScrollButtons);
      });
    };
  }, [portfolioMedia, selectedCategory]);

  // Add styles for enhanced UI
  const styles = `
    .gallery-container-main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      margin-top: 80px; /* Add top margin to account for navbar */
    }
    .gallery-header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 0 20px;
      position: relative;
      z-index: 10; /* Ensure it's above other elements */
    }
    .gallery-header {
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }
    .back-button {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border: none;
      background: rgba(163, 40, 244, 0.1);
      color: #333;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      z-index: 15; /* Higher z-index to ensure it's clickable */
      font-weight: 500;
      min-width: 80px;
      justify-content: center;
    }
    .back-button:hover {
      background: rgba(163, 40, 244, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(163, 40, 244, 0.2);
    }
    .back-button:disabled {
      background: rgba(163, 40, 244, 0.05);
      color: #999;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .back-button:disabled:hover {
      background: rgba(163, 40, 244, 0.05);
      transform: none;
      box-shadow: none;
    }
    .edit-gallery-button {
      padding: 8px 20px;
      background: #a328f4;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .edit-gallery-button:hover {
      background: #8a1fd1;
    }
    .gallery-categories {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      padding: 0 20px;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      -webkit-overflow-scrolling: touch;
    }
    .gallery-categories::-webkit-scrollbar {
      display: none;
    }
    .category-button {
      padding: 8px 20px;
      border: 1px solid #ddd;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      font-size: 14px;
    }
    .category-button:hover {
      border-color: #a328f4;
      color: #a328f4;
    }
    .category-button.active {
      background: #a328f4;
      color: white;
      border-color: #a328f4;
    }
    .category-carousel {
      margin-bottom: 40px;
    }
    .category-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      padding: 0 20px;
      color: #333;
    }
    .carousel-container {
      position: relative;
      width: 100%;
      overflow: visible;
      margin: 0 -20px;
    }
    .slick-slider {
      overflow: visible;
      margin: 0 -20px;
    }
    .slick-list {
      overflow: visible;
      padding: 0 20px;
    }
    .slick-track {
      display: flex;
      align-items: center;
    }
    .carousel-item {
      position: relative;
      padding: 10px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .gallery-image, .gallery-video {
      width: 100%;
      height: 500px;
      object-fit: cover;
      border-radius: 12px;
      transition: all 0.2s ease;
      background: #f8f9fa;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: high-quality;
    }
    .video-container-gallery {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      background: #f8f9fa;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 500px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .video-container-gallery:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    .video-container-gallery video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    .video-container.playing video {
      object-fit: cover;
    }
    .video-play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2));
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 1;
      transition: all 0.3s ease;
      border-radius: 8px;
      backdrop-filter: blur(2px);
    }
    .video-container.playing .video-play-overlay {
      opacity: 0;
      pointer-events: none;
    }
    .video-container-gallery:hover .video-play-overlay {
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
      transform: scale(1.05);
    }
    .play-button {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      border: 3px solid rgba(163, 40, 244, 0.8);
      color: #a328f4;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .play-button:hover {
      transform: scale(1.1);
      background: white;
      border-color: #a328f4;
      box-shadow: 0 6px 25px rgba(163, 40, 244, 0.3);
    }
    .video-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      padding: 20px 15px 15px;
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 0 0 8px 8px;
    }
    .video-container-gallery.playing:hover .video-controls {
      opacity: 1;
    }
    .video-progress {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      margin-bottom: 10px;
      cursor: pointer;
      position: relative;
    }
    .video-progress-bar {
      height: 100%;
      background: #a328f4;
      border-radius: 2px;
      transition: width 0.1s ease;
      position: relative;
    }
    .video-progress-bar::after {
      content: '';
      position: absolute;
      right: -4px;
      top: -2px;
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .video-time {
      color: white;
      font-size: 12px;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    .video-controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .video-controls-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .video-control-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    }
    .video-control-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
    
    .video-control-btn.fullscreen-btn {
      background: rgba(163, 40, 244, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .video-control-btn.fullscreen-btn:hover {
      background: rgba(163, 40, 244, 1);
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.1);
    }
    .volume-slider {
      width: 60px;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    }
    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .volume-slider::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .video-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .video-error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      text-align: center;
      background: rgba(220, 53, 69, 0.9);
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 14px;
    }
    .custom-dots {
      display: flex !important;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      margin: 0;
      list-style: none;
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
      background: #ddd;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .custom-dots li.slick-active button {
      background: #a328f4;
      transform: scale(1.2);
    }
    .quick-view {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 90vw;
      max-height: 90vh;
    }
    .quick-view img, .quick-view video {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }
    .media-count {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
    }
    .category-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      padding: 0 20px;
      flex-wrap: wrap;
    }
    .stat-item {
      background: #f8f9fa;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      color: #666;
      white-space: nowrap;
    }
    .stat-item strong {
      color: #333;
      margin-right: 5px;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .gallery-container-main {
        padding: 0;
        margin-top: 0;
        width: 100%;
        max-width: 100%;
      }
      .gallery-header-container {
        padding: 16px;
        margin-bottom: 0;
        flex-direction: row;
        gap: 10px;
        align-items: center;
        background: white;
        border-bottom: 1px solid #eee;
      }
      .gallery-header {
        font-size: 20px;
        order: 2;
        flex: 1;
        text-align: center;
        margin: 0;
      }
      .back-button {
        padding: 8px 12px;
        font-size: 14px;
        order: 1;
        position: static;
        background: rgba(163, 40, 244, 0.1);
        border-radius: 8px;
        margin: 0;
      }
      .edit-gallery-button {
        padding: 8px 16px;
        font-size: 14px;
        order: 3;
        border-radius: 8px;
      }
      .gallery-categories {
        padding: 16px;
        margin-bottom: 0;
        gap: 8px;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        background: white;
        border-bottom: 1px solid #eee;
      }
      .gallery-categories::-webkit-scrollbar {
        display: none;
      }
      .category-button {
        padding: 8px 16px;
        font-size: 13px;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: fit-content;
        border-radius: 20px;
      }
      .category-title {
        font-size: 18px;
        padding: 16px;
        margin-bottom: 0;
        background: white;
        border-bottom: 1px solid #eee;
      }
      .gallery-image, .gallery-video {
        height: 90vh;
        border-radius: 0;
        object-fit: cover;
        width: 100%;
      }
      .video-container-gallery {
        height: 90vh;
        border-radius: 0;
        width: 100%;
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container:hover {
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container video {
        height: 100%;
        object-fit: cover;
        border-radius: 0;
        width: 100%;
      }
      .video-container.playing video {
        object-fit: cover;
      }
      .video-play-overlay {
        border-radius: 0;
        backdrop-filter: none;
      }
      .video-container:hover .video-play-overlay {
        transform: none;
      }
      .play-button {
        width: 60px;
        height: 60px;
        font-size: 18px;
        border-width: 2px;
      }
      .video-controls {
        padding: 15px 10px 10px;
        opacity: 1;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      }
      .video-progress {
        height: 3px;
        margin-bottom: 8px;
      }
      .video-progress-bar::after {
        width: 6px;
        height: 6px;
        right: -3px;
        top: -1.5px;
      }
      .video-time {
        font-size: 11px;
      }
      .video-controls-row {
        gap: 8px;
      }
      .video-controls-buttons {
        gap: 6px;
      }
      .video-control-btn {
        width: 20px;
        height: 20px;
        font-size: 10px;
      }
      
      .video-control-btn.fullscreen-btn {
        background: rgba(163, 40, 244, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      .volume-slider {
        width: 50px;
        height: 3px;
      }
      .volume-slider::-webkit-slider-thumb {
        width: 10px;
        height: 10px;
      }
      .volume-slider::-moz-range-thumb {
        width: 10px;
        height: 10px;
      }
      .category-stats {
        padding: 16px;
        gap: 10px;
        margin-bottom: 0;
        justify-content: center;
        background: white;
        border-bottom: 1px solid #eee;
      }
      .stat-item {
        padding: 8px 16px;
        font-size: 13px;
        flex: 1;
        text-align: center;
        min-width: 0;
        border-radius: 20px;
      }
      .carousel-container {
        margin: 0;
        padding: 0;
        height: 90vh;
        width: 100%;
      }
      .slick-slider {
        margin: 0;
        height: 90vh;
        width: 100%;
      }
      .slick-list {
        padding: 0;
        height: 90vh;
        width: 100%;
      }
      .slick-track {
        height: 90vh;
        width: 100%;
      }
      .carousel-item {
        padding: 0;
        height: 90vh;
        width: 100%;
      }
      .slick-slide {
        width: 100% !important;
      }
      .slick-slide > div {
        width: 100%;
      }
      .custom-arrow {
        width: 40px !important;
        height: 40px !important;
        border-radius: 40px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(14px) !important;
      }
      .custom-next-arrow {
        right: 10px !important;
      }
      .custom-prev-arrow {
        left: 10px !important;
      }
      .custom-dots {
        bottom: 20px;
      }
      .custom-dots li button {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.5);
      }
      .custom-dots li.slick-active button {
        background: white;
      }
    }

    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .gallery-container-main {
        padding: 0;
        margin-top: 0;
      }
      .gallery-header-container {
        padding: 12px;
        margin-bottom: 0;
        gap: 8px;
      }
      .gallery-header {
        font-size: 18px;
        margin-top: 0;
      }
      .back-button {
        padding: 6px 10px;
        font-size: 13px;
        position: static;
      }
      .edit-gallery-button {
        padding: 6px 12px;
        font-size: 13px;
      }
      .gallery-categories {
        padding: 12px;
        margin-bottom: 0;
        gap: 6px;
      }
      .category-button {
        padding: 6px 12px;
        font-size: 12px;
      }
      .category-title {
        font-size: 16px;
        padding: 12px;
        margin-bottom: 0;
      }
      .gallery-image, .gallery-video {
        height: 80vh;
        border-radius: 0;
        object-fit: cover;
      }
      .video-container {
        height: 80vh;
        border-radius: 0;
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container:hover {
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container video {
        height: 100%;
        object-fit: cover;
        border-radius: 0;
      }
      .video-container.playing video {
        object-fit: cover;
      }
      .play-button {
        width: 50px;
        height: 50px;
        font-size: 16px;
        border-width: 2px;
      }
      .video-controls {
        padding: 12px 8px 8px;
        opacity: 1;
      }
      .video-progress {
        height: 2px;
        margin-bottom: 6px;
      }
      .video-progress-bar::after {
        width: 5px;
        height: 5px;
        right: -2.5px;
        top: -1.5px;
      }
      .video-time {
        font-size: 10px;
      }
      .category-stats {
        padding: 12px;
        gap: 8px;
        margin-bottom: 0;
        flex-direction: row;
      }
      .stat-item {
        padding: 6px 12px;
        font-size: 12px;
        width: auto;
        text-align: center;
        flex: 1;
      }
      .carousel-container {
        margin: 0;
        padding: 0;
        height: 80vh;
        width: 100%;
      }
      .slick-slider {
        margin: 0;
        height: 80vh;
        width: 100%;
      }
      .slick-list {
        padding: 0;
        height: 80vh;
        width: 100%;
      }
      .carousel-item {
        padding: 0;
        height: 80vh;
        width: 100%;
      }
      .slick-slide {
        width: 100% !important;
      }
      .slick-slide > div {
        width: 100%;
      }
      .custom-arrow {
        width: 35px !important;
        height: 35px !important;
        border-radius: 35px !important;
      }
      .custom-next-arrow {
        right: 8px !important;
      }
      .custom-prev-arrow {
        left: 8px !important;
      }
      .custom-dots {
        bottom: 15px;
      }
      .custom-dots li button {
        width: 6px;
        height: 6px;
      }
    }

    /* Extra Small Mobile Styles */
    @media (max-width: 360px) {
      .gallery-container-main {
        padding: 6px;
        margin-top: 65px;
      }
      .gallery-header-container {
        padding: 0 6px;
        margin-bottom: 12px;
        gap: 10px;
      }
      .gallery-header {
        font-size: 18px;
        margin-top: 8px;
      }
      .back-button {
        padding: 5px 10px;
        font-size: 12px;
        top: 6px;
        left: 6px;
      }
      .edit-gallery-button {
        padding: 5px 12px;
        font-size: 12px;
      }
      .gallery-categories {
        padding: 0 6px;
        margin-bottom: 12px;
        gap: 4px;
      }
      .category-button {
        padding: 5px 12px;
        font-size: 11px;
      }
      .category-title {
        font-size: 15px;
        padding: 0 6px;
        margin-bottom: 10px;
      }
      .gallery-image, .gallery-video {
        height: 200px;
        border-radius: 4px;
      }
      .video-container {
        border-radius: 4px;
        height: 200px;
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container:hover {
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container video {
        height: 100%;
        object-fit: contain;
        border-radius: 4px;
      }
      .video-container.playing video {
        object-fit: contain;
      }
      .play-button {
        width: 40px;
        height: 40px;
        font-size: 14px;
        border-width: 2px;
      }
      .video-controls {
        padding: 8px 6px 6px;
        opacity: 1;
      }
      .video-progress {
        height: 2px;
        margin-bottom: 4px;
      }
      .video-progress-bar::after {
        width: 4px;
        height: 4px;
        right: -2px;
        top: -1px;
      }
      .video-time {
        font-size: 9px;
      }
      .category-stats {
        padding: 0 6px;
        gap: 6px;
        margin-bottom: 10px;
      }
      .stat-item {
        padding: 5px 10px;
        font-size: 11px;
      }
      .carousel-container {
        margin: 0;
        padding: 0 6px;
      }
      .slick-slider {
        margin: 0 -6px;
      }
      .slick-list {
        padding: 0 6px;
      }
      .carousel-item {
        padding: 3px;
      }
      .custom-arrow {
        width: 28px !important;
        height: 28px !important;
        border-radius: 28px !important;
      }
      .custom-next-arrow {
        right: 1px !important;
      }
      .custom-prev-arrow {
        left: 1px !important;
      }
      .custom-dots {
        bottom: -18px;
      }
      .custom-dots li button {
        width: 4px;
        height: 4px;
      }
    }

    /* Touch-friendly improvements */
    @media (hover: none) and (pointer: coarse) {
      .carousel-item {
        min-height: 200px;
      }
      .gallery-image, .gallery-video {
        cursor: pointer;
      }
      .category-button {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .play-button {
        min-width: 44px;
        min-height: 44px;
      }
      .custom-arrow {
        min-width: 44px !important;
        min-height: 44px !important;
      }
      .video-container {
        cursor: pointer;
        min-height: 200px;
      }
      .video-controls {
        opacity: 1;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
      }
      .video-progress {
        min-height: 6px;
        cursor: pointer;
      }
      .video-progress-bar::after {
        min-width: 12px;
        min-height: 12px;
        cursor: pointer;
      }
    }

    /* Landscape mobile optimization */
    @media (max-width: 768px) and (orientation: landscape) {
      .gallery-container-main {
        margin-top: 50px;
      }
      .gallery-header-container {
        flex-direction: row;
        align-items: center;
        gap: 10px;
      }
      .gallery-header {
        order: 2;
        flex: 1;
        text-align: center;
        margin: 0;
      }
      .back-button {
        order: 1;
        position: static;
        background: rgba(163, 40, 244, 0.1);
      }
      .edit-gallery-button {
        order: 3;
      }
      .gallery-image, .gallery-video {
        height: 180px;
      }
      .video-container {
        height: 180px;
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container:hover {
        transform: none !important;
        box-shadow: none !important;
      }
      .video-container video {
        height: 100%;
        object-fit: cover;
        border-radius: 0;
      }
      .video-container.playing video {
        object-fit: cover;
      }
      .play-button {
        width: 50px;
        height: 50px;
        font-size: 18px;
        border-width: 2px;
      }
      .video-controls {
        opacity: 1;
        padding: 10px 8px 8px;
      }
      .video-progress {
        height: 3px;
        margin-bottom: 6px;
      }
      .video-progress-bar::after {
        width: 6px;
        height: 6px;
        right: -3px;
        top: -1.5px;
      }
      .video-time {
        font-size: 11px;
      }
      .category-stats {
        flex-direction: row;
        justify-content: space-around;
      }
      .stat-item {
        flex: 1;
        max-width: 120px;
      }
    }
  `;

  // Add category stats calculation
  const getCategoryStats = () => {
    const stats = {
      totalMedia: 0,
      totalVideos: 0,
      totalImages: 0
    };

    Object.values(portfolioMedia).forEach(mediaArray => {
      mediaArray.forEach(media => {
        stats.totalMedia++;
        if (media.type === 'video') {
          stats.totalVideos++;
        } else {
          stats.totalImages++;
        }
      });
    });

    return stats;
  };

  // Add quick view handler
  const handleQuickView = (media) => {
    setQuickViewMedia(media);
  };

  // Add hover handler
  const handleMediaHover = (media) => {
    setHoveredMedia(media);
  };

  // Add a key to force slider re-render when currentIndex changes
  const sliderKey = `slider-${selectedMedia?.currentIndex}`;

  // Video cleanup function
  const cleanupVideos = () => {
    const videos = document.querySelectorAll('.gallery-video');
    videos.forEach(video => {
      if (!video.paused) {
        video.pause();
        video.currentTime = 0;
      }
      // Remove playing class
      const container = video.parentElement;
      if (container) {
        container.classList.remove('playing');
      }
    });
  };

  // Handle video volume change
  const handleVolumeChange = (videoUrl, newVolume) => {
    setVideoVolumes(prev => ({ ...prev, [videoUrl]: newVolume }));
    const video = document.querySelector(`video[src="${videoUrl}"]`);
    if (video) {
      video.volume = newVolume;
    }
  };

  // Handle video mute toggle
  const handleMuteToggle = (videoUrl) => {
    setMutedVideos(prev => ({ ...prev, [videoUrl]: !prev[videoUrl] }));
    const video = document.querySelector(`video[src="${videoUrl}"]`);
    if (video) {
      video.muted = !mutedVideos[videoUrl];
    }
  };

  // Cleanup videos when component unmounts or category changes
  useEffect(() => {
    return () => {
      cleanupVideos();
    };
  }, [selectedCategory]);

  // Pause all videos when modal opens
  useEffect(() => {
    if (selectedMedia) {
      cleanupVideos();
    }
  }, [selectedMedia]);

  // Create dynamic settings based on media count
  const getDynamicSettings = (mediaArray) => {
    const hasMultipleItems = mediaArray.length > 1;
    const hasVideos = mediaArray.some(media => media.type === 'video');
    
    return {
      ...settings,
      infinite: hasMultipleItems,
      centerMode: false, // Always disable center mode for full-width photos
      centerPadding: '0px',
      slidesToShow: windowWidth >= 1200 ? 3 : windowWidth >= 768 ? 2 : 1,
      responsive: [
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            centerMode: false,
            centerPadding: '0px'
          }
        }
      ]
    };
  };

  const handleViewGallery = () => {
    // Prevent multiple rapid navigation attempts
    if (isNavigating) return;
    
    setIsNavigating(true);
    handleCloseModal();
    
    if (isModal && onBackToPortfolio) {
      onBackToPortfolio();
      setIsNavigating(false);
    } else if (isModal && onModalClose) {
      onModalClose();
      setIsNavigating(false);
    } else {
      // Handle navigation for standalone Gallery component
      try {
        // Additional safety check: ensure we have valid business context
        const currentBusinessId = businessId || paramBusinessId;
        const currentBusinessName = businessName || paramBusinessName;
        
        // Validate business context
        if (!currentBusinessId || !currentBusinessName) {
          console.warn('Missing business context for navigation');
          setError('Business information not available. Please refresh the page.');
          setIsNavigating(false);
          return;
        }
        
        // Try to go back first, but with additional safety checks
        if (window.history.length > 1 && window.location.pathname !== '/') {
          navigate(-1);
        } else {
          // If no history or at root, navigate to the business portfolio
          navigate(`/portfolio/${currentBusinessId}/${currentBusinessName}`);
        }
      } catch (error) {
        console.warn('Navigation error:', error);
        setError('Navigation failed. Please try again.');
        // Fallback navigation based on available context
        try {
          const currentBusinessId = businessId || paramBusinessId;
          const currentBusinessName = businessName || paramBusinessName;
          
          if (currentBusinessId && currentBusinessName) {
            navigate(`/portfolio/${currentBusinessId}/${currentBusinessName}`);
          } else {
            navigate('/');
          }
        } catch (fallbackError) {
          console.error('Fallback navigation also failed:', fallbackError);
          setError('Unable to navigate. Please refresh the page.');
        }
      } finally {
        // Reset navigation state after a delay to allow navigation to complete
        setTimeout(() => setIsNavigating(false), 1000);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container-main">
      <style>{styles}</style>
      <div className="gallery-header-container">
        <button 
          className="back-button" 
          onClick={handleViewGallery}
          disabled={isNavigating}
        >
          <span style={{display: 'inline-block', marginRight: 8, verticalAlign: 'middle'}} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display: 'block'}}>
              <circle cx="11" cy="11" r="11" fill="rgba(163,40,244,0.13)"/>
              <path d="M13.5 7L9.5 11L13.5 15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {isNavigating ? 'Going back...' : 'Back'}
        </button>
        <div className="gallery-header">Gallery</div>
        {isBusinessOwner && (
          <button 
            className="edit-gallery-button"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Gallery
          </button>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="error-message" style={{
          background: '#fee',
          color: '#c33',
          padding: '10px 20px',
          margin: '0 20px 20px 20px',
          borderRadius: '8px',
          border: '1px solid #fcc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c33',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Category Stats */}
      <div className="category-stats">
        {(() => {
          const stats = getCategoryStats();
          return (
            <div className="stats-container">
              <span className="stat-item">
                <strong>{stats.totalMedia}</strong> Total
              </span>
              <span className="stat-item">
                <strong>{stats.totalImages}</strong> Images
              </span>
              <span className="stat-item">
                <strong>{stats.totalVideos}</strong> Videos
              </span>
            </div>
          );
        })()}
      </div>

      {/* Show category navigation only if there are multiple categories */}
      {categories.length > 1 && (
        <div className="gallery-categories">
          <button 
            className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
          {portfolioMedia['photos']?.length > 0 && (
            <button 
              className={`category-button ${selectedCategory === 'photos' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('photos')}
            >
              Photos
            </button>
          )}
        </div>
      )}

      {/* Show content directly if there's only one category */}
      {categories.length === 1 ? (
        <div className="category-carousel">
          <div className="carousel-container">
            {(() => {
              const categoryMedia = portfolioMedia[categories[0].id] || [];
              const photosMedia = portfolioMedia['photos'] || [];
              const mediaToShow = categoryMedia.length > 0 ? categoryMedia : photosMedia;
              console.log('Single category rendering:', {
                categoryId: categories[0].id,
                categoryName: categories[0].name,
                categoryMedia: categoryMedia,
                photosMedia: photosMedia,
                mediaToShow: mediaToShow
              });
              return (
                <Slider {...getDynamicSettings(mediaToShow)}>
                                    {mediaToShow.map((media, index) => (
                    <div
                      key={index}
                      className="carousel-item"
                      onClick={() => handleMediaClick(media, index)}
                    >
                      {media.type === 'video' ? (
                        <div className="video-container">
                          <video
                            src={media.url}
                            className="gallery-video"
                            poster={`${media.url}?thumb`}
                            preload="metadata"
                            muted
                            autoPlay={index < AUTO_PLAY_COUNT}
                            loop
                            playsInline
                            onLoadStart={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loading' }))}
                            onLoadedData={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loaded' }))}
                            onError={() => setImageLoading(prev => ({ ...prev, [media.url]: 'error' }))}
                            onPlay={(e) => {
                              e.target.parentElement.classList.add('playing');
                            }}
                            onPause={(e) => {
                              e.target.parentElement.classList.remove('playing');
                            }}
                            onTimeUpdate={(e) => {
                              const video = e.target;
                              const container = video.parentElement;
                              const progressBar = container.querySelector('.video-progress-bar');
                              const currentTime = container.querySelector('.video-time');
                              
                              if (progressBar && currentTime) {
                                const progress = (video.currentTime / video.duration) * 100;
                                progressBar.style.width = `${progress}%`;
                                
                                const currentMinutes = Math.floor(video.currentTime / 60);
                                const currentSeconds = Math.floor(video.currentTime % 60);
                                const totalMinutes = Math.floor(video.duration / 60);
                                const totalSeconds = Math.floor(video.duration % 60);
                                
                                currentTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const video = e.target;
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                          />
                          
                          {/* Loading State */}
                          {imageLoading[media.url] === 'loading' && (
                            <div className="video-loading"></div>
                          )}
                          
                          {/* Error State */}
                          {imageLoading[media.url] === 'error' && (
                            <div className="video-error">
                              <i className="fas fa-exclamation-triangle"></i>
                              <br />
                              Video unavailable
                            </div>
                          )}
                        
                          
                          {/* Video Controls */}
                          {imageLoading[media.url] === 'loaded' && (
                            <div className="video-controls">
                              <div 
                                className="video-progress"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const video = e.currentTarget.parentElement.parentElement.querySelector('video');
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const clickX = e.clientX - rect.left;
                                  const width = rect.width;
                                  const clickTime = (clickX / width) * video.duration;
                                  video.currentTime = clickTime;
                                }}
                              >
                                <div className="video-progress-bar" style={{ width: '0%' }}></div>
                              </div>
                              <div className="video-controls-row">
                                <div className="video-time">0:00 / 0:00</div>
                                <div className="video-controls-buttons">
                                  <button
                                    className="video-control-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMuteToggle(media.url);
                                    }}
                                    title={mutedVideos[media.url] ? "Unmute" : "Mute"}
                                  >
                                    <i className={`fas fa-volume-${mutedVideos[media.url] ? 'mute' : 'up'}`}></i>
                                  </button>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={videoVolumes[media.url] || 0.5}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleVolumeChange(media.url, parseFloat(e.target.value));
                                    }}
                                    className="volume-slider"
                                    title="Volume"
                                  />
                                  <button
                                    className="video-control-btn fullscreen-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMediaClick(media, index);
                                    }}
                                    title="Full Screen"
                                  >
                                    <i className="fas fa-expand"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ImageErrorBoundary>
                          <img
                            src={media.url}
                            alt={`${categories[0].name} ${index + 1}`}
                            className="gallery-image"
                            loading="lazy"
                          />
                        </ImageErrorBoundary>
                      )}
                    </div>
                  ))}
                </Slider>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Show category carousels for multiple categories */
        selectedCategory === 'all' ? (
          <>
            {categories.map(category => (
              portfolioMedia[category.id]?.length > 0 && (
                <div key={category.id} className="category-carousel">
                  <h3 className="category-title">{category.name}</h3>
                  <div className="carousel-container">
                    <Slider {...getDynamicSettings(portfolioMedia[category.id])}>
                      {portfolioMedia[category.id].map((media, index) => (
                        <div
                          key={index}
                          className="carousel-item"
                          onClick={() => handleMediaClick(media, index)}
                        >
                          {media.type === 'video' ? (
                            <div className="video-container-gallery">
                              <video
                                src={media.url}
                                className="gallery-video"
                                poster={`${media.url}?thumb`}
                                preload="metadata"
                                muted
                                autoPlay={index < AUTO_PLAY_COUNT}
                                loop
                                playsInline
                                onLoadStart={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loading' }))}
                                onLoadedData={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loaded' }))}
                                onError={() => setImageLoading(prev => ({ ...prev, [media.url]: 'error' }))}
                                onPlay={(e) => {
                                  e.target.parentElement.classList.add('playing');
                                }}
                                onPause={(e) => {
                                  e.target.parentElement.classList.remove('playing');
                                }}
                                onTimeUpdate={(e) => {
                                  const video = e.target;
                                  const container = video.parentElement;
                                  const progressBar = container.querySelector('.video-progress-bar');
                                  const currentTime = container.querySelector('.video-time');
                                  
                                  if (progressBar && currentTime) {
                                    const progress = (video.currentTime / video.duration) * 100;
                                    progressBar.style.width = `${progress}%`;
                                    
                                    const currentMinutes = Math.floor(video.currentTime / 60);
                                    const currentSeconds = Math.floor(video.currentTime % 60);
                                    const totalMinutes = Math.floor(video.duration / 60);
                                    const totalSeconds = Math.floor(video.duration % 60);
                                    
                                    currentTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const video = e.target;
                                  if (video.paused) {
                                    video.play();
                                  } else {
                                    video.pause();
                                  }
                                }}
                              />
                              
                              {/* Loading State */}
                              {imageLoading[media.url] === 'loading' && (
                                <div className="video-loading"></div>
                              )}
                              
                              {/* Error State */}
                              {imageLoading[media.url] === 'error' && (
                                <div className="video-error">
                                  <i className="fas fa-exclamation-triangle"></i>
                                  <br />
                                  Video unavailable
                                </div>
                              )}
                            
                              
                              {/* Video Controls */}
                              {imageLoading[media.url] === 'loaded' && (
                                <div className="video-controls">
                                  <div 
                                    className="video-progress"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const video = e.currentTarget.parentElement.parentElement.querySelector('video');
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const clickX = e.clientX - rect.left;
                                      const width = rect.width;
                                      const clickTime = (clickX / width) * video.duration;
                                      video.currentTime = clickTime;
                                    }}
                                  >
                                    <div className="video-progress-bar" style={{ width: '0%' }}></div>
                                  </div>
                                  <div className="video-controls-row">
                                    <div className="video-time">0:00 / 0:00</div>
                                    <div className="video-controls-buttons">
                                      <button
                                        className="video-control-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMuteToggle(media.url);
                                        }}
                                        title={mutedVideos[media.url] ? "Unmute" : "Mute"}
                                      >
                                        <i className={`fas fa-volume-${mutedVideos[media.url] ? 'mute' : 'up'}`}></i>
                                      </button>
                                      <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={videoVolumes[media.url] || 0.5}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleVolumeChange(media.url, parseFloat(e.target.value));
                                        }}
                                        className="volume-slider"
                                        title="Volume"
                                      />
                                      <button
                                        className="video-control-btn fullscreen-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMediaClick(media, index);
                                        }}
                                        title="Full Screen"
                                      >
                                        <i className="fas fa-expand"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <ImageErrorBoundary>
                              <img
                                src={media.url}
                                alt={`${category.name} ${index + 1}`}
                                className="gallery-image"
                                loading="lazy"
                              />
                            </ImageErrorBoundary>
                          )}
                        </div>
                      ))}
                    </Slider>
                  </div>
                </div>
              )
            ))}
            {portfolioMedia['photos']?.length > 0 && (
              <div className="category-carousel">
                <h3 className="category-title">Photos</h3>
                <div className="carousel-container">
                  <Slider {...getDynamicSettings(portfolioMedia['photos'])}>
                    {portfolioMedia['photos'].map((media, index) => (
                      <div
                        key={index}
                        className="carousel-item"
                        onClick={() => handleMediaClick(media, index)}
                      >
                        {media.type === 'video' ? (
                          <div className="video-container-gallery">
                            <video
                              src={media.url}
                              className="gallery-video"
                              poster={`${media.url}?thumb`}
                              preload="metadata"
                              muted
                              autoPlay={index < AUTO_PLAY_COUNT}
                              loop
                              playsInline
                              onLoadStart={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loading' }))}
                              onLoadedData={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loaded' }))}
                              onError={() => setImageLoading(prev => ({ ...prev, [media.url]: 'error' }))}
                              onPlay={(e) => {
                                e.target.parentElement.classList.add('playing');
                              }}
                              onPause={(e) => {
                                e.target.parentElement.classList.remove('playing');
                              }}
                              onTimeUpdate={(e) => {
                                const video = e.target;
                                const container = video.parentElement;
                                const progressBar = container.querySelector('.video-progress-bar');
                                const currentTime = container.querySelector('.video-time');
                                
                                if (progressBar && currentTime) {
                                  const progress = (video.currentTime / video.duration) * 100;
                                  progressBar.style.width = `${progress}%`;
                                  
                                  const currentMinutes = Math.floor(video.currentTime / 60);
                                  const currentSeconds = Math.floor(video.currentTime % 60);
                                  const totalMinutes = Math.floor(video.duration / 60);
                                  const totalSeconds = Math.floor(video.duration % 60);
                                  
                                  currentTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const video = e.target;
                                if (video.paused) {
                                  video.play();
                                } else {
                                  video.pause();
                                }
                              }}
                            />
                            
                            {/* Loading State */}
                            {imageLoading[media.url] === 'loading' && (
                              <div className="video-loading"></div>
                            )}
                            
                            {/* Error State */}
                            {imageLoading[media.url] === 'error' && (
                              <div className="video-error">
                                <i className="fas fa-exclamation-triangle"></i>
                                <br />
                                Video unavailable
                              </div>
                            )}
                          
                            
                            {/* Video Controls */}
                            {imageLoading[media.url] === 'loaded' && (
                              <div className="video-controls">
                                <div 
                                  className="video-progress"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const video = e.currentTarget.parentElement.parentElement.querySelector('video');
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const width = rect.width;
                                    const clickTime = (clickX / width) * video.duration;
                                    video.currentTime = clickTime;
                                  }}
                                >
                                  <div className="video-progress-bar" style={{ width: '0%' }}></div>
                                </div>
                                <div className="video-controls-row">
                                  <div className="video-time">0:00 / 0:00</div>
                                  <div className="video-controls-buttons">
                                    <button
                                      className="video-control-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMuteToggle(media.url);
                                      }}
                                      title={mutedVideos[media.url] ? "Unmute" : "Mute"}
                                    >
                                      <i className={`fas fa-volume-${mutedVideos[media.url] ? 'mute' : 'up'}`}></i>
                                    </button>
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={videoVolumes[media.url] || 0.5}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleVolumeChange(media.url, parseFloat(e.target.value));
                                      }}
                                      className="volume-slider"
                                      title="Volume"
                                    />
                                    <button
                                      className="video-control-btn fullscreen-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMediaClick(media, index);
                                      }}
                                      title="Full Screen"
                                    >
                                      <i className="fas fa-expand"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <ImageErrorBoundary>
                            <img
                              src={media.url}
                              alt={`Media ${index + 1}`}
                              className="gallery-image"
                              loading="lazy"
                            />
                          </ImageErrorBoundary>
                        )}
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="category-carousel">
            <div className="carousel-container">
              <Slider {...getDynamicSettings(portfolioMedia[selectedCategory] || [])}>
                {(portfolioMedia[selectedCategory] || []).map((media, index) => (
                  <div
                    key={index}
                    className="carousel-item"
                    onClick={() => handleMediaClick(media, index)}
                  >
                    {media.type === 'video' ? (
                      <div className="video-container">
                        <video
                          src={media.url}
                          className="gallery-video"
                          poster={`${media.url}?thumb`}
                          preload="metadata"
                          muted
                          autoPlay={index < AUTO_PLAY_COUNT}
                          loop
                          playsInline
                          onLoadStart={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loading' }))}
                          onLoadedData={() => setImageLoading(prev => ({ ...prev, [media.url]: 'loaded' }))}
                          onError={() => setImageLoading(prev => ({ ...prev, [media.url]: 'error' }))}
                          onPlay={(e) => {
                            e.target.parentElement.classList.add('playing');
                          }}
                          onPause={(e) => {
                            e.target.parentElement.classList.remove('playing');
                          }}
                          onTimeUpdate={(e) => {
                            const video = e.target;
                            const container = video.parentElement;
                            const progressBar = container.querySelector('.video-progress-bar');
                            const currentTime = container.querySelector('.video-time');
                            
                            if (progressBar && currentTime) {
                              const progress = (video.currentTime / video.duration) * 100;
                              progressBar.style.width = `${progress}%`;
                              
                              const currentMinutes = Math.floor(video.currentTime / 60);
                              const currentSeconds = Math.floor(video.currentTime % 60);
                              const totalMinutes = Math.floor(video.duration / 60);
                              const totalSeconds = Math.floor(video.duration % 60);
                              
                              currentTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const video = e.target;
                            if (video.paused) {
                              video.play();
                            } else {
                              video.pause();
                            }
                          }}
                        />
                        
                        {/* Loading State */}
                        {imageLoading[media.url] === 'loading' && (
                          <div className="video-loading"></div>
                        )}
                        
                        {/* Error State */}
                        {imageLoading[media.url] === 'error' && (
                          <div className="video-error">
                            <i className="fas fa-exclamation-triangle"></i>
                            <br />
                            Video unavailable
                          </div>
                        )}
                        

                        
                        {/* Video Controls */}
                        {imageLoading[media.url] === 'loaded' && (
                          <div className="video-controls">
                            <div 
                              className="video-progress"
                              onClick={(e) => {
                                e.stopPropagation();
                                const video = e.currentTarget.parentElement.parentElement.querySelector('video');
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const width = rect.width;
                                const clickTime = (clickX / width) * video.duration;
                                video.currentTime = clickTime;
                              }}
                            >
                              <div className="video-progress-bar" style={{ width: '0%' }}></div>
                            </div>
                            <div className="video-controls-row">
                              <div className="video-time">0:00 / 0:00</div>
                              <div className="video-controls-buttons">
                                <button
                                  className="video-control-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMuteToggle(media.url);
                                  }}
                                  title={mutedVideos[media.url] ? "Unmute" : "Mute"}
                                >
                                  <i className={`fas fa-volume-${mutedVideos[media.url] ? 'mute' : 'up'}`}></i>
                                </button>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={videoVolumes[media.url] || 0.5}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleVolumeChange(media.url, parseFloat(e.target.value));
                                  }}
                                  className="volume-slider"
                                  title="Volume"
                                />
                                <button
                                  className="video-control-btn fullscreen-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMediaClick(media, index);
                                  }}
                                  title="Full Screen"
                                >
                                  <i className="fas fa-expand"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ImageErrorBoundary>
                        <img
                          src={media.url}
                          alt={`Media ${index + 1}`}
                          className="gallery-image"
                          loading="lazy"
                        />
                      </ImageErrorBoundary>
                    )}
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        )
      )}

      <ImageModal
        isOpen={!!selectedMedia}
        mediaUrl={selectedMedia?.url}
        isVideo={selectedMedia?.isVideo}
        onClose={handleCloseModal}
        categoryMedia={selectedMedia?.categoryMedia}
        currentIndex={selectedMedia?.currentIndex}
        businessId={businessId}
      />

      <EditGalleryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        businessId={businessId}
        categories={categories}
        onMediaUpdate={fetchPortfolioMedia}
      />

      {/* Add quick view modal */}
      {quickViewMedia && (
        <div className="quick-view" onClick={() => setQuickViewMedia(null)}>
          {quickViewMedia.type === 'video' ? (
            <video
              src={quickViewMedia.url}
              controls
              autoPlay
              className="quick-view-media"
            />
          ) : (
            <img
              src={quickViewMedia.url}
              alt="Quick view"
              className="quick-view-media"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Gallery;
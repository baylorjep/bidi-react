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

const Gallery = () => {
  const { businessId } = useParams();
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

  const settings = {
    dots: true,
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
          dots: false
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
        <span style={{ color: '#fff', fontSize: '20px' }}>→</span>
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
        <span style={{ color: '#fff', fontSize: '20px' }}>←</span>
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
    const currentCategoryMedia = selectedCategory === 'all' 
      ? Object.values(portfolioMedia).flat()
      : portfolioMedia[selectedCategory] || [];
    
    // Find the correct index in the current category media
    const correctIndex = currentCategoryMedia.findIndex(item => item.url === media.url);
    
    console.log('Gallery - currentCategoryMedia:', currentCategoryMedia);
    console.log('Gallery - correctIndex:', correctIndex);

    setSelectedMedia({
      url: media.url,
      isVideo: media.type === 'video',
      categoryMedia: currentCategoryMedia,
      currentIndex: correctIndex
    });
    console.log('Gallery - setSelectedMedia called with:', {
      url: media.url,
      isVideo: media.type === 'video',
      categoryMediaLength: currentCategoryMedia.length,
      currentIndex: correctIndex
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
    }
    .gallery-header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 0 20px;
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
    }
    .back-button:hover {
      background: rgba(163, 40, 244, 0.2);
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
    }
    .slick-slider {
      overflow: visible;
    }
    .slick-list {
      overflow: visible;
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
      height: 250px;
      object-fit: cover;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    .video-container {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
    }
    .video-play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .video-container:hover .video-play-overlay {
      opacity: 1;
    }
    .play-button {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #a328f4;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .play-button:hover {
      transform: scale(1.1);
      background: white;
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
        padding: 10px;
        margin-top: 60px; /* Add space for fixed back button */
      }
      .gallery-header-container {
        padding: 0 10px;
        margin-bottom: 20px;
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }
      .gallery-header {
        font-size: 24px;
        order: 2;
        width: 100%;
        text-align: center;
      }
      .back-button {
        padding: 8px 16px;
        font-size: 14px;
        order: 1;
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      .edit-gallery-button {
        padding: 8px 18px;
        font-size: 14px;
        order: 3;
        align-self: flex-end;
      }
      .gallery-categories {
        padding: 0 10px;
        margin-bottom: 20px;
        gap: 8px;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
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
      }
      .category-title {
        font-size: 18px;
        padding: 0 10px;
        margin-bottom: 15px;
      }
      .gallery-image, .gallery-video {
        height: 280px;
        border-radius: 8px;
      }
      .category-stats {
        padding: 0 10px;
        gap: 10px;
        margin-bottom: 15px;
        justify-content: center;
      }
      .stat-item {
        padding: 8px 16px;
        font-size: 13px;
        flex: 1;
        text-align: center;
        min-width: 0;
      }
      .carousel-container {
        margin: 0;
        padding: 0 10px;
      }
      .slick-slider {
        margin: 0 -10px;
      }
      .slick-list {
        padding: 0 10px;
      }
      .carousel-item {
        padding: 5px;
      }
      .play-button {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }
      .video-container {
        border-radius: 8px;
      }
      .custom-arrow {
        width: 35px !important;
        height: 35px !important;
        border-radius: 35px !important;
      }
      .custom-next-arrow {
        right: 5px !important;
      }
      .custom-prev-arrow {
        left: 5px !important;
      }
      .custom-dots {
        bottom: -25px;
      }
      .custom-dots li button {
        width: 6px;
        height: 6px;
      }
    }

    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .gallery-container-main {
        padding: 8px;
        margin-top: 70px;
      }
      .gallery-header-container {
        padding: 0 8px;
        margin-bottom: 15px;
        gap: 12px;
      }
      .gallery-header {
        font-size: 20px;
        margin-top: 10px;
      }
      .back-button {
        padding: 6px 12px;
        font-size: 13px;
        top: 8px;
        left: 8px;
      }
      .edit-gallery-button {
        padding: 6px 14px;
        font-size: 13px;
      }
      .gallery-categories {
        padding: 0 8px;
        margin-bottom: 15px;
        gap: 6px;
      }
      .category-button {
        padding: 6px 14px;
        font-size: 12px;
      }
      .category-title {
        font-size: 16px;
        padding: 0 8px;
        margin-bottom: 12px;
      }
      .gallery-image, .gallery-video {
        height: 220px;
        border-radius: 6px;
      }
      .category-stats {
        padding: 0 8px;
        gap: 8px;
        margin-bottom: 12px;
        flex-direction: column;
      }
      .stat-item {
        padding: 6px 12px;
        font-size: 12px;
        width: 100%;
        text-align: center;
      }
      .carousel-container {
        margin: 0;
        padding: 0 8px;
      }
      .slick-slider {
        margin: 0 -8px;
      }
      .slick-list {
        padding: 0 8px;
      }
      .carousel-item {
        padding: 4px;
      }
      .play-button {
        width: 35px;
        height: 35px;
        font-size: 14px;
      }
      .video-container {
        border-radius: 6px;
      }
      .custom-arrow {
        width: 30px !important;
        height: 30px !important;
        border-radius: 30px !important;
      }
      .custom-next-arrow {
        right: 2px !important;
      }
      .custom-prev-arrow {
        left: 2px !important;
      }
      .custom-dots {
        bottom: -20px;
      }
      .custom-dots li button {
        width: 5px;
        height: 5px;
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
      .play-button {
        width: 30px;
        height: 30px;
        font-size: 12px;
      }
      .video-container {
        border-radius: 4px;
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          Loading gallery...
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container-main">
      <style>{styles}</style>
      <div className="gallery-header-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <span style={{display: 'inline-block', marginRight: 8, verticalAlign: 'middle'}} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display: 'block'}}>
              <circle cx="11" cy="11" r="11" fill="rgba(163,40,244,0.13)"/>
              <path d="M13.5 7L9.5 11L13.5 15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          Back
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
      
      {/* Category Stats */}
      <div className="category-stats">
        {(() => {
          const stats = getCategoryStats();
          return (
            <>
              <div className="stat-item">
                <strong>{stats.totalMedia}</strong> Total Media
              </div>
              <div className="stat-item">
                <strong>{stats.totalImages}</strong> Images
              </div>
              <div className="stat-item">
                <strong>{stats.totalVideos}</strong> Videos
              </div>
            </>
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
            <Slider {...settings}>
              {portfolioMedia[categories[0].id]?.map((media, index) => (
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
                      />
                      <div className="video-play-overlay">
                        <button 
                          className="play-button"
                          onClick={e => {
                            e.stopPropagation();
                            const video = e.currentTarget.parentElement.previousElementSibling;
                            if (video.paused) {
                              video.play();
                              e.currentTarget.parentElement.style.display = 'none';
                            }
                          }}
                        >
                          ▶
                        </button>
                      </div>
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
                    <Slider {...settings}>
                      {portfolioMedia[category.id].map((media, index) => (
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
                              />
                              <div className="video-play-overlay">
                                <button 
                                  className="play-button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    const video = e.currentTarget.parentElement.previousElementSibling;
                                    if (video.paused) {
                                      video.play();
                                      e.currentTarget.parentElement.style.display = 'none';
                                    }
                                  }}
                                >
                                  ▶
                                </button>
                              </div>
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
                  <Slider {...settings}>
                    {portfolioMedia['photos'].map((media, index) => (
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
                            />
                            <div className="video-play-overlay">
                              <button 
                                className="play-button"
                                onClick={e => {
                                  e.stopPropagation();
                                  const video = e.currentTarget.parentElement.previousElementSibling;
                                  if (video.paused) {
                                    video.play();
                                    e.currentTarget.parentElement.style.display = 'none';
                                  }
                                }}
                              >
                                ▶
                              </button>
                            </div>
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
              <Slider {...settings}>
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
                        />
                        <div className="video-play-overlay">
                          <button 
                            className="play-button"
                            onClick={e => {
                              e.stopPropagation();
                              const video = e.currentTarget.parentElement.previousElementSibling;
                              if (video.paused) {
                                video.play();
                                e.currentTarget.parentElement.style.display = 'none';
                              }
                            }}
                          >
                            ▶
                          </button>
                        </div>
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
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Portfolio.css";
import EditProfileModal from "./EditProfileModal"; // Import modal component
import ImageModal from "./ImageModal"; // Import the new ImageModal component
import Modal from "react-modal"; // Import the modal 
import { convertHeicToJpeg } from "../../../utils/imageUtils";
import LoadingSpinner from "../../LoadingSpinner"; // Import the loading spinner component
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AuthModal from "../../Request/Authentication/AuthModal";
import GoogleReviews from './GoogleReviews';
import { Helmet } from 'react-helmet-async';
import ConsultationModal from '../../Consultation/ConsultationModal';
import { useConsultation } from '../../../hooks/useConsultation';
import { useGoogleCalendar } from '../../../hooks/useGoogleCalendar';
import { toast } from 'react-toastify';

// SVG Components
const StarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.3065 4.67953L20.6532 9.37287C20.9732 10.0262 21.8265 10.6529 22.5465 10.7729L26.7999 11.4795C29.5199 11.9329 30.1599 13.9062 28.1999 15.8529L24.8932 19.1595C24.3332 19.7195 24.0265 20.7995 24.1999 21.5729L25.1465 25.6662C25.8932 28.9062 24.1732 30.1595 21.3065 28.4662L17.3199 26.1062C16.5999 25.6795 15.4132 25.6795 14.6799 26.1062L10.6932 28.4662C7.83988 30.1595 6.10655 28.8929 6.85321 25.6662L7.79988 21.5729C7.97321 20.7995 7.66655 19.7195 7.10655 19.1595L3.79988 15.8529C1.85321 13.9062 2.47988 11.9329 5.19988 11.4795L9.45321 10.7729C10.1599 10.6529 11.0132 10.0262 11.3332 9.37287L13.6799 4.67953C14.9599 2.13286 17.0399 2.13286 18.3065 4.67953Z" fill="#FFC500" stroke="#FFC500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmptyStarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.3065 4.67953L20.6532 9.37287C20.9732 10.0262 21.8265 10.6529 22.5465 10.7729L26.7999 11.4795C29.5199 11.9329 30.1599 13.9062 28.1999 15.8529L24.8932 19.1595C24.3332 19.7195 24.0265 20.7995 24.1999 21.5729L25.1465 25.6662C25.8932 28.9062 24.1732 30.1595 21.3065 28.4662L17.3199 26.1062C16.5999 25.6795 15.4132 25.6795 14.6799 26.1062L10.6932 28.4662C7.83988 30.1595 6.10655 28.8929 6.85321 25.6662L7.79988 21.5729C7.97321 20.7995 7.66655 19.7195 7.10655 19.1595L3.79988 15.8529C1.85321 13.9062 2.47988 11.9329 5.19988 11.4795L9.45321 10.7729C10.1599 10.6529 11.0132 10.0262 11.3332 9.37287L13.6799 4.67953C14.9599 2.13286 17.0399 2.13286 18.3065 4.67953Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.68638 8.5104C6.06546 8.13132 6.68203 8.13329 7.06354 8.5148L7.79373 9.24498L9.93117 7.10754C10.3102 6.72847 10.9268 6.73044 11.3083 7.11195C11.6898 7.49345 11.6918 8.11003 11.3127 8.48911L8.48891 11.3129C8.10983 11.692 7.49326 11.69 7.11175 11.3085L5.69078 9.88756C5.30927 9.50605 5.3073 8.88947 5.68638 8.5104Z" fill="#A328F4"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M6.3585 1.15414C7.77571 -0.384714 10.2243 -0.384714 11.6415 1.15414C11.904 1.43921 12.2814 1.59377 12.6709 1.57577C14.7734 1.4786 16.5048 3.19075 16.4065 5.26985C16.3883 5.655 16.5446 6.02814 16.8329 6.28775C18.389 7.68919 18.389 10.1105 16.8329 11.512C16.5446 11.7716 16.3883 12.1447 16.4065 12.5299C16.5048 14.609 14.7734 16.3211 12.6709 16.2239C12.2814 16.2059 11.904 16.3605 11.6415 16.6456C10.2243 18.1844 7.77571 18.1844 6.3585 16.6456C6.09596 16.3605 5.71863 16.2059 5.32915 16.2239C3.22665 16.3211 1.49524 14.609 1.5935 12.5299C1.6117 12.1447 1.4554 11.7716 1.16713 11.512C-0.389043 10.1105 -0.389043 7.68919 1.16713 6.28775C1.4554 6.02814 1.6117 5.655 1.5935 5.26985C1.49524 3.19075 3.22665 1.4786 5.32915 1.57577C5.71863 1.59377 6.09596 1.43921 6.3585 1.15414ZM9.96822 2.66105C9.44875 2.097 8.55125 2.097 8.03178 2.66105C7.31553 3.43878 6.28608 3.86045 5.22349 3.81134C4.45284 3.77572 3.81821 4.40329 3.85422 5.16537C3.90388 6.21614 3.47747 7.23413 2.69099 7.94241C2.12059 8.4561 2.12059 9.34362 2.69099 9.8573C3.47747 10.5656 3.90388 11.5836 3.85422 12.6343C3.81821 13.3964 4.45284 14.024 5.22349 13.9884C6.28608 13.9393 7.31553 14.3609 8.03178 15.1387C8.55125 15.7027 9.44875 15.7027 9.96822 15.1387C10.6845 14.3609 11.7139 13.9393 12.7765 13.9884C13.5472 14.024 14.1818 13.3964 14.1458 12.6343C14.0961 11.5836 14.5225 10.5656 15.309 9.8573C15.8794 9.34362 15.8794 8.4561 15.309 7.94241C14.5225 7.23414 14.0961 6.21614 14.1458 5.16537C14.1818 4.40329 13.5472 3.77572 12.7765 3.81134C11.7139 3.86045 10.6845 3.43878 9.96822 2.66105Z" fill="#A328F4"/>
  </svg>
);

// Add this utility function after the VerifiedIcon component
const formatLocationName = (name) => {
    if (!name) return '';
    
    // Handle special cases
    const specialCases = {
        'slc': 'Salt Lake City',
        'salt-lake': 'Salt Lake',
        'salt-lake-county': 'Salt Lake County',
        'slc-county': 'Salt Lake County',
        'slc county': 'Salt Lake County',
        'salt lake county': 'Salt Lake County',
        'salt lake': 'Salt Lake',
        'saltlake': 'Salt Lake',
        'saltlakecounty': 'Salt Lake County',
        'slc County': 'Salt Lake County',
        'salt-lake-city': 'Salt Lake City',
        'west-valley-city': 'West Valley City',
        'west-jordan': 'West Jordan',
        'south-jordan': 'South Jordan',
        'cottonwood-heights': 'Cottonwood Heights',
        'south-salt-lake': 'South Salt Lake',
        'pleasant-grove': 'Pleasant Grove',
        'spanish-fork': 'Spanish Fork',
        'american-fork': 'American Fork',
        'saratoga-springs': 'Saratoga Springs',
        'eagle-mountain': 'Eagle Mountain',
        'cedar-hills': 'Cedar Hills',
        'north-salt-lake': 'North Salt Lake',
        'woods-cross': 'Woods Cross',
        'fruit-heights': 'Fruit Heights',
        'west-bountiful': 'West Bountiful',
        'south-ogden': 'South Ogden',
        'north-ogden': 'North Ogden',
        'washington-terrace': 'Washington Terrace',
        'pleasant-view': 'Pleasant View',
        'st-george': 'St. George',
        'washington-city': 'Washington City',
        'santa-clara': 'Santa Clara',
        'la-verkin': 'La Verkin',
        'north-logan': 'North Logan',
        'stansbury-park': 'Stansbury Park',
        'kimball-junction': 'Kimball Junction',
        'heber-city': 'Heber City',
        'park-city': 'Park City'
    };

    // Convert to lowercase for comparison
    const lowerName = name.toLowerCase();
    
    // Check for special cases
    if (specialCases[lowerName]) {
        return specialCases[lowerName];
    }

    // Handle cases where "county" is appended
    if (lowerName.includes('county')) {
        const baseName = lowerName.replace('county', '').trim();
        if (specialCases[baseName]) {
            return specialCases[baseName] + ' County';
        }
    }

    // Split by hyphens and spaces, capitalize each word
    return name
        .split(/[- ]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// ReviewModal component for writing a review
const ReviewModal = ({ isOpen, onClose, onSubmit, rating, setRating, comment, setComment, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <button className="review-modal-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div className="review-modal-title">Write a Review</div>
        <div className="review-modal-rating-row">
          {[1,2,3,4,5].map((star) => (
            <div
              key={star}
              className="star-icon-portfolio"
              style={{ cursor: 'pointer', width: 28, height: 28 }}
              onClick={() => setRating(star)}
            >
              {star <= rating ? <StarIcon /> : <EmptyStarIcon />}
            </div>
          ))}
        </div>
        <textarea
          className="review-modal-textarea"
          placeholder="Share your experience..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={1000}
        />
        <div className="review-modal-buttons">
          <button className="review-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="review-modal-submit" onClick={onSubmit} disabled={loading || !comment.trim()}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this component before the Portfolio component
const MediaItem = ({ item, index, onImageClick }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const handleVideoClick = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(error => {
                    console.error('Error playing video:', error);
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const isVideo = item.photo_type === 'video';

    return (
        <div className="media-item" onClick={() => onImageClick(item)}>
            {isVideo ? (
                <div className="video-container">
                    <video
                        ref={videoRef}
                        src={item.photo_url}
                        className="portfolio-image video"
                        muted={!isPlaying}
                        loop
                        playsInline
                        onClick={handleVideoClick}
                        onEnded={() => setIsPlaying(false)}
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                    {!isPlaying && (
                        <div className="video-play-overlay">
                            <button className="play-button">▶</button>
                        </div>
                    )}
                </div>
            ) : (
                <img
                    src={item.photo_url}
                    alt={`Portfolio ${index + 1}`}
                    className="portfolio-image"
                    loading="lazy"
                />
            )}
        </div>
    );
};

const Portfolio = ({ businessId: propBusinessId }) => {
  const { businessId: paramBusinessId } = useParams();
  const businessId = propBusinessId || paramBusinessId;
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isIndividual, setIsIndividual] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bidStats, setBidStats] = useState({ average: null, count: 0 });
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [showServiceAreas, setShowServiceAreas] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [convertedUrls, setConvertedUrls] = useState({});
  const [fromBid, setFromBid] = useState(false);
  const [bidData, setBidData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [fromVendorSelection, setFromVendorSelection] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showCalendarReconnectModal, setShowCalendarReconnectModal] = useState(false);
  const descriptionRef = useRef(null);
  const { connectCalendar } = useGoogleCalendar();
  const {
    selectedDate,
    selectedTimeSlot,
    availableTimeSlots,
    isLoading: isConsultationLoading,
    error: consultationError,
    handleDateSelect,
    handleTimeSlotSelect,
    fetchTimeSlots,
    scheduleConsultation
  } = useConsultation();

  // Add slider settings
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    dots: false,
    beforeChange: (oldIndex, newIndex) => {
        // Pause any playing videos when changing slides
        const videos = document.querySelectorAll('.portfolio-image.video');
        videos.forEach(video => {
            video.pause();
            const overlay = video.parentElement?.querySelector('.video-play-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        });
    },
    afterChange: (currentSlide) => {
        // Reset video state when changing slides
        const videos = document.querySelectorAll('.portfolio-image.video');
        videos.forEach(video => {
            video.currentTime = 0;
            const overlay = video.parentElement?.querySelector('.video-play-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        });
    }
  };

  // Add arrow components
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
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(14px)', 
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="m9 18 6-6-6-6"/></svg>
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
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(14px)', 
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m15 18-6-6 6-6"/></svg>
        </span>
      </button>
    );
  }

  // Update the renderMediaItem function in the Portfolio component
  const renderMediaItem = (item, index) => {
    return (
        <MediaItem 
            key={index}
            item={item}
            index={index}
            onImageClick={handleImageClick}
        />
    );
  };

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .single();

      if (businessError) throw businessError;

      if (businessData) {
        setBusiness(businessData);
        // Set services from specializations array
        setServices(businessData.specializations || []);
        // Set service areas from service_areas array
        setServiceAreas(businessData.service_areas || []);
        
        // Fetch packages from business_packages table
        const { data: packagesData, error: packagesError } = await supabase
          .from("business_packages")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: true });

        if (packagesError) {
          console.error("Error fetching packages:", packagesError);
          setPackages([]);
        } else {
          setPackages(packagesData || []);
        }
        
        // Check if business has Google Calendar connected
        console.log('Business data google_calendar_connected:', businessData.google_calendar_connected);
        console.log('Business data keys:', Object.keys(businessData));
        setIsCalendarConnected(!!businessData.google_calendar_connected);
        console.log('Setting isCalendarConnected to:', !!businessData.google_calendar_connected);

        // Fetch profile photo
        const { data: profileData, error: profileError } = await supabase
          .from("profile_photos")
          .select("photo_url")
          .eq("user_id", businessId)
          .eq("photo_type", "profile")
          .single();
        if (profileData) setProfileImage(profileData.photo_url);
        else if (profileError) console.error("Error fetching profile image:", profileError);

        // Fetch portfolio media
        const { data: portfolioData, error: portfolioError } = await supabase
          .from("profile_photos")
          .select("photo_url, photo_type, display_order")
          .eq("user_id", businessId)
          .or("photo_type.eq.portfolio,photo_type.eq.video")
          .order("display_order", { ascending: true });

        if (portfolioError) {
          console.error("Error fetching portfolio media:", portfolioError);
        } else {
          const sortedMedia = portfolioData.sort(
            (a, b) => a.display_order - b.display_order
          );

          const videos = [];
          const images = [];

          sortedMedia.forEach((item) => {
            if (item.photo_type === "video") {
              videos.push(item.photo_url);
            } else {
              images.push(item.photo_url);
            }
          });

          setPortfolioVideos(videos);
          setPortfolioPics(images);
        }

        // Check user role and ownership
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          if (user.id === businessId) {
            setIsOwner(true);
          } else {
            const { data: userData, error: userDataError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single();
            
            if (userDataError) {
              console.error("Error fetching user role:", userDataError);
            } else {
              setIsIndividual(userData?.role === "individual");
            }
          }
        }

        // Fetch reviews
        const { data: reviewData, error: reviewError } = await supabase
          .from("reviews")
          .select("rating, first_name")
          .eq("vendor_id", businessId);

        if (reviewError) {
          console.error("Error fetching reviews:", reviewError);
        } else {
          const avgRating =
            reviewData.length > 0
              ? (
                  reviewData.reduce((acc, review) => acc + review.rating, 0) /
                  reviewData.length
                ).toFixed(1)
              : null;
          setAverageRating(avgRating);
        }

        // Fetch bids
        const { data: bidData, error: bidError } = await supabase
          .from("bids")
          .select("bid_amount")
          .eq("user_id", businessId);

        if (bidError) {
          console.error("Error fetching bids:", bidError);
        } else if (bidData && bidData.length > 0) {
          const totalBids = bidData.reduce((acc, bid) => acc + bid.bid_amount, 0);
          const averageBid = (totalBids / bidData.length).toFixed(0);
          setBidStats({
            average: averageBid,
            count: bidData.length,
          });
        }

        // Fetch detailed reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating, comment, first_name, created_at")
          .eq("vendor_id", businessId);

        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
        } else {
          setReviews(reviewsData);
          const avgRating =
            reviewsData.length > 0
              ? (
                  reviewsData.reduce((acc, review) => acc + review.rating, 0) /
                  reviewsData.length
                ).toFixed(1)
              : null;
          setAverageRating(avgRating);
        }
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
      setError("Failed to load business data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  useEffect(() => {
    const convertImages = async () => {
      const converted = {};
      if (profileImage) {
        converted.profile = await convertHeicToJpeg(profileImage);
      }
      for (const photo of portfolioPics) {
        // Skip if already WebP
        if (photo.toLowerCase().endsWith('.webp')) {
          converted[photo] = photo;
          continue;
        }
        converted[photo] = await convertHeicToJpeg(photo);
      }
      setConvertedUrls(converted);
    };

    convertImages();

    // Cleanup function
    return () => {
      Object.values(convertedUrls).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [profileImage, portfolioPics]);

  useEffect(() => {
    if (location.state?.fromBid) {
      setFromBid(true);
      setBidData({
        ...location.state.bidData,
        id: location.state.bidId // Add the bid ID to the bid data
      });
    }
    // Detect if coming from vendor selection
    if (location.state?.fromVendorSelection) {
      setFromVendorSelection(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (descriptionRef.current && bidData?.description) {
      setTimeout(() => {
        const height = descriptionRef.current.scrollHeight;
        console.log('Description height:', height); // Debug log
        setShowReadMore(height > 100);
      }, 0);
    }
  }, [bidData?.description]);

  const handleProfilePicEdit = () => {
    openEditModal({
      story: business.story,
      business_owner: business.business_owner,
    }, 'profile');
  };

  const openEditModal = (fields, section) => {
    setEditFields({
      ...fields,
      currentSection: section,
      portfolio: {
        images: portfolioPics,
        videos: portfolioVideos
      }
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    fetchBusinessData();
    toast.success('Profile updated successfully!');
  };

  const handleCheckClick = (event) => {
    // Check if we're in the overlay (mobile) or regular header (desktop)
    const tooltip = event.currentTarget.querySelector(".verified-tooltip") || 
                   event.currentTarget.querySelector(".verified-tooltip-overlay");
    
    if (tooltip) {
      tooltip.style.visibility = "visible";
      tooltip.style.opacity = "1";
      tooltip.style.zIndex = "1000";
      setTimeout(() => {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
        tooltip.style.zIndex = "1";
      }, 3000);
    } else {
      // Fallback if tooltip element is not found
    }
  };

  const handleGetQuote = () => {
    // Format the vendor data as expected by MasterRequestFlow
    const vendorData = {
      vendor: {
        id: business.id,
        business_name: business.business_name,
        business_category: business.business_category,
        business_address: business.business_address,
        profile_photo_url: profileImage
      },
      image: profileImage
    };

    // Format the category to match the expected format in RequestCategories.js
    let formattedCategory;
    if (Array.isArray(business.business_category)) {
      formattedCategory = business.business_category[0];
    } else {
      formattedCategory = business.business_category;
    }
    // Map to canonical category names if needed
    if (formattedCategory) {
      if (formattedCategory.toLowerCase().includes('wedding planner')) {
        formattedCategory = 'WeddingPlanning';
      } else if (formattedCategory.toLowerCase().includes('beauty')) {
        formattedCategory = 'HairAndMakeup';
      } else {
        formattedCategory = formattedCategory.charAt(0).toUpperCase() + formattedCategory.slice(1).replace(/\s/g, '');
      }
    }

    // Navigate to the master request flow with the vendor data and selected category
    navigate("/master-request-flow", { 
      state: { 
        vendor: vendorData,
        selectedCategories: [formattedCategory]
      }
    });
  };

  const handleImageClick = (media) => {
    console.log('handleImageClick called with:', media);
    
    // Check if it's a video and handle full screen
    if (media && typeof media === 'object' && media.isVideo) {
      // Create full screen video element
      const fullScreenVideo = document.createElement('video');
      fullScreenVideo.src = media.url;
      fullScreenVideo.controls = true;
      fullScreenVideo.autoplay = true;
      fullScreenVideo.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        z-index: 9999;
        object-fit: contain;
      `;
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      `;
      
      closeButton.onmouseenter = () => {
        closeButton.style.background = 'rgba(0, 0, 0, 0.9)';
      };
      
      closeButton.onmouseleave = () => {
        closeButton.style.background = 'rgba(0, 0, 0, 0.7)';
      };
      
      const closeFullScreen = () => {
        document.body.removeChild(fullScreenVideo);
        document.body.removeChild(closeButton);
        document.removeEventListener('keydown', handleEscKey);
        document.removeEventListener('click', handleOutsideClick);
      };
      
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          closeFullScreen();
        }
      };
      
      const handleOutsideClick = (e) => {
        if (e.target === fullScreenVideo) {
          closeFullScreen();
        }
      };
      
      closeButton.onclick = closeFullScreen;
      
      // Add event listeners
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('click', handleOutsideClick);
      
      // Add to DOM
      document.body.appendChild(fullScreenVideo);
      document.body.appendChild(closeButton);
      
      return; // Exit early for videos
    }
    
    // Create the categoryMedia array first, but only take first 5 items
    const allMedia = [...portfolioVideos, ...portfolioPics]
      .slice(0, 5)
      .map(item => ({
        url: item,
        type: portfolioVideos.includes(item) ? 'video' : 'image'
      }));
    
    console.log('All media:', allMedia);

    // If media is already an object with url and isVideo properties
    if (media && typeof media === 'object' && 'url' in media) {
      // For profile picture, we need to create a categoryMedia array with just that image
      if (media.isProfile) {
        console.log('Profile picture clicked');
        setSelectedImage({
          url: media.url,
          isVideo: false,
          categoryMedia: [{
            url: media.url,
            type: 'image'
          }],
          currentIndex: 0
        });
      } else {
        // For portfolio images/videos
        console.log('Portfolio media clicked');
        const currentIndex = allMedia.findIndex(item => item.url === media.url);
        console.log('Current index:', currentIndex);
        
        setSelectedImage({
          url: media.url,
          isVideo: media.isVideo,
          categoryMedia: allMedia,
          currentIndex: currentIndex >= 0 ? currentIndex : 0
        });
      }
    } 
    // If media is just a URL string (for backward compatibility)
    else if (typeof media === 'string') {
      console.log('String URL clicked');
      const isVideo = media.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm)$/);
      const currentIndex = allMedia.findIndex(item => item.url === media);
      console.log('Current index:', currentIndex);
      
      setSelectedImage({
        url: media,
        isVideo: !!isVideo,
        categoryMedia: allMedia,
        currentIndex: currentIndex >= 0 ? currentIndex : 0
      });
    }
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  const toggleReview = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const openReviewModal = () => setIsReviewModalOpen(true);
  const closeReviewModal = () => setIsReviewModalOpen(false);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return;
    }

    try {
      // Get user's first name from individual_profiles
      const { data: userData, error: profileError } = await supabase
        .from("individual_profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (profileError || !userData) {
        console.error("Error fetching user profile:", profileError);
        return;
      }

      const { error: reviewError } = await supabase.from("reviews").insert([
        {
          vendor_id: businessId,
          customer_id: user.id,
          first_name: userData.first_name,
          rating: newReview.rating,
          comment: newReview.comment,
          created_at: new Date().toISOString(),
        },
      ]);

      if (reviewError) {
        console.error("Error posting review:", reviewError);
        return;
      }

      setNewReview({ rating: 5, comment: "" });
      closeReviewModal();
      fetchBusinessData();
    } catch (error) {
      console.error("Error in review submission:", error);
    }
  };

  const handleChatClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    navigate('/individual-dashboard', {
      state: {
        activeSection: 'messages',
        selectedChat: {
          id: businessId,
          name: business.business_name,
          profileImage: profileImage
        }
      }
    });
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowConsultationModal(true);
  };

  const handleScheduleConsultation = async (data) => {
    try {
      // Get current user information
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile information
      const { data: profile, error: profileError } = await supabase
        .from('individual_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to get user profile');
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();
      const customerEmail = user.email;

      console.log('About to schedule consultation with data:', {
        businessId,
        startTime: data.selectedTimeSlot,
        customerEmail,
        customerName
      });

      await scheduleConsultation({
        businessId,
        bidId: null, // Not needed for portfolio consultations
        startTime: data.selectedTimeSlot,
        customerEmail,
        customerName
      });
      
      setShowConsultationModal(false);
      toast.success('Consultation scheduled successfully! Please check your email for details.');
      // Show success message or handle post-scheduling actions
    } catch (error) {
      console.error('Error in handleScheduleConsultation:', error);
      
      // Show a more user-friendly error message
      const errorMessage = error.message || 'Failed to schedule consultation. Please try again.';
      console.error('Error message:', errorMessage);
      
      // If it's a calendar authorization error, suggest reconnecting
      if (errorMessage.includes('authorization expired') || errorMessage.includes('access denied')) {
        if (isOwner) {
          setShowCalendarReconnectModal(true);
        }
      } else {
        // Show error toast for other errors
        toast.error(errorMessage);
      }
    }
  };

  const handleCalendarReconnect = async () => {
    try {
      setShowConsultationModal(false);
      await connectCalendar();
      setShowCalendarReconnectModal(false);
    } catch (error) {
      console.error('Error reconnecting calendar:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const handleAction = (action, id) => {
    setIsAnimating(true);
    setTimeout(() => {
      action(id);
    }, 300); // Match this with the CSS animation duration
  };

  const handleDeny = async (bidId) => {
    try {
      if (!bidId) {
        console.error('No bid ID provided');
        toast.error('Failed to deny bid: Missing bid ID');
        return;
      }

      const { error } = await supabase
        .from('bids')
        .update({ status: 'denied' })
        .eq('id', bidId);

      if (error) {
        console.error('Error denying bid:', error);
        throw error;
      }

      // Update local state
      setBidData(prev => ({
        ...prev,
        status: 'denied'
      }));

      // Navigate based on user type
      if (isIndividual) {
        navigate('/individual-dashboard', { state: { activeSection: 'bids' } });
      } else {
        navigate('/business-dashboard', { state: { activeSection: 'bids' } });
      }
    } catch (error) {
      console.error('Error denying bid:', error);
      toast.error('Failed to deny bid. Please try again.');
    }
  };

  const handleApprove = async (bidId) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (error) throw error;

      // Update local state
      setBidData(prev => ({
        ...prev,
      status: 'accepted'
      }));

      // Navigate based on user type
      if (isIndividual) {
        navigate('/individual-dashboard', { state: { activeSection: 'bids' } });
      } else {
        navigate('/business-dashboard', { state: { activeSection: 'bids' } });
      }
    } catch (error) {
      console.error('Error approving bid:', error);
      toast.error('Failed to approve bid. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleSelection = () => {
    setIsSelected(!isSelected);
    // You can add additional logic here to handle the selection state
    // For example, adding/removing from a global selected vendors list
  };

  const handleLearnMore = (packageName) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const messageTemplate = `Hi, I'm interested in learning more about your "${packageName}" package. Could you provide more details?`;
    
    navigate('/individual-dashboard', {
      state: {
        activeSection: 'messages',
        selectedChat: {
          id: businessId,
          name: business.business_name,
          profileImage: profileImage
        },
        initialMessage: messageTemplate
      }
    });
  };

  // Add SEO title and description
  const getSeoTitle = () => {
    if (!business) return 'Vendor Portfolio | Bidi';
    const category = Array.isArray(business.business_category) 
      ? business.business_category[0] 
      : business.business_category;
    
    // Handle case where category is undefined or null
    if (!category) {
      return `${business.business_name} | Vendor Portfolio & Reviews`;
    }
    
    // Format the category name to be more natural
    let formattedCategory = category;
    if (category.toLowerCase().includes('photography')) {
      formattedCategory = 'Photographer';
    } else if (category.toLowerCase().includes('videography')) {
      formattedCategory = 'Videographer';
    } else if (category.toLowerCase().includes('beauty')) {
      formattedCategory = 'Hair and Makeup Artist';
    } else if (category.toLowerCase().includes('wedding planner')) {
      formattedCategory = 'Wedding Planner';
    } else if (category.toLowerCase().includes('catering')) {
      formattedCategory = 'Caterer';
    } else if (category.toLowerCase().includes('florist') || category.toLowerCase().includes('flowers')) {
      formattedCategory = 'Florist';
    } else if (category.toLowerCase().includes('dj') || category.toLowerCase().includes('disc jockey')) {
      formattedCategory = 'DJ';
    } else if (category.toLowerCase().includes('venue')) {
      formattedCategory = 'Venue';
    } else if (category.toLowerCase().includes('cake') || category.toLowerCase().includes('bakery')) {
      formattedCategory = 'Baker';
    } else {
      // Capitalize first letter and remove any extra spaces
      formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).replace(/\s+/g, ' ');
    }
    
    return `Is ${business.business_name} a Good ${formattedCategory}? | Reviews & Portfolio`;
  };

  const getSeoDescription = () => {
    if (!business) return 'View vendor portfolio and reviews on Bidi';
    const category = Array.isArray(business.business_category) 
      ? business.business_category[0] 
      : business.business_category;
    
    // Handle case where category is undefined or null
    if (!category) {
      return `Discover ${business.business_name}'s services, portfolio, and ${reviews.length} verified reviews. View their work, packages, and contact them directly on Bidi.`;
    }
    
    return `Discover ${business.business_name}'s ${category} services, portfolio, and ${reviews.length} verified reviews. View their work, packages, and contact them directly on Bidi.`;
  };

  const handleConsultationClick = () => {
    console.log('=== handleConsultationClick START ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isCalendarConnected:', isCalendarConnected);
    console.log('business:', business);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }
    
    console.log('User authenticated, showing consultation modal');
    setShowConsultationModal(true);
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Vendor Portfolio | Bidi</title>
          <meta name="description" content="Loading vendor portfolio and reviews on Bidi" />
          <meta httpEquiv="Content-Language" content="en" />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <LoadingSpinner color="#9633eb" size={50} />
      </>
    );
  }

  if (!business) {
    return (
      <>
        <Helmet>
          <title>Vendor Not Found | Bidi</title>
          <meta name="description" content="The requested vendor portfolio could not be found on Bidi" />
          <meta httpEquiv="Content-Language" content="en" />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <p>Error: Business not found.</p>
      </>
    );
  }

  const categories = Array.isArray(business?.business_category)
    ? business.business_category
    : [business?.business_category].filter(Boolean);

  return (
    <>
      <Helmet>
        <title>{getSeoTitle()}</title>
        <meta name="description" content={getSeoDescription()} />
        <meta property="og:title" content={getSeoTitle()} />
        <meta property="og:description" content={getSeoDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={profileImage || portfolioPics[0] || "/images/og-image.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${business.business_name} portfolio image`} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getSeoTitle()} />
        <meta name="twitter:description" content={getSeoDescription()} />
        <meta name="twitter:image" content={profileImage || portfolioPics[0] || "/images/og-image.png"} />
        <meta name="twitter:image:alt" content={`${business.business_name} portfolio image`} />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
        <meta httpEquiv="Content-Language" content="en" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": business?.business_name,
            "image": profileImage,
            "description": business?.business_description,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": business?.business_address
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": averageRating,
              "reviewCount": reviews.length
            },
            "review": reviews.slice(0, 3).map(review => ({
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating
              },
              "author": {
                "@type": "Person",
                "name": review.first_name
              },
              "reviewBody": review.comment
            }))
          })}
        </script>
      </Helmet>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        businessId={businessId}
        initialData={editFields}
      />

      <ImageModal
        isOpen={!!selectedImage}
        mediaUrl={selectedImage?.url}
        isVideo={selectedImage?.isVideo}
        onClose={handleCloseImageModal}
        categoryMedia={selectedImage?.categoryMedia || []}
        currentIndex={selectedImage?.currentIndex || 0}
        businessId={businessId}
      />

      {showAuthModal && (
        <AuthModal 
          setIsModalOpen={setShowAuthModal}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={closeReviewModal}
        onSubmit={handleReviewSubmit}
        rating={newReview.rating}
        setRating={r => setNewReview(nr => ({ ...nr, rating: r }))}
        comment={newReview.comment}
        setComment={c => setNewReview(nr => ({ ...nr, comment: c }))}
        loading={false}
      />

      <div className="portfolio-container">
        <div className={`portfolio-layout ${portfolioVideos.length + portfolioPics.length <= 1 ? "single-media" : ""}`}>

          {/* Mobile Swiper */}
          <div className="portfolio-images-mobile">
            {/* Fixed Business Header Overlay */}
            <div className="business-header-overlay">
              <div className="business-header-content">
                <div className="business-header-top">
                  <div className="business-name-overlay">{business.business_name}</div>
                  {(business.is_verified || business.Bidi_Plus) && (
                    <div className="verified-check-container-overlay" onClick={handleCheckClick}>
                      <VerifiedIcon />
                      <span className="verified-tooltip-overlay">
                        This business is verified by Bidi. You will have a 100% money back guarantee if you pay through Bidi.
                      </span>
                    </div>
                  )}
                </div>
                {averageRating && (
                  <div className="rating-overlay">
                    <div className="star-icon-overlay">
                      <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.3065 4.67953L20.6532 9.37287C20.9732 10.0262 21.8265 10.6529 22.5465 10.7729L26.7999 11.4795C29.5199 11.9329 30.1599 13.9062 28.1999 15.8529L24.8932 19.1595C24.3332 19.7195 24.0265 20.7995 24.1999 21.5729L25.1465 25.6662C25.8932 28.9062 24.1732 30.1595 21.3065 28.4662L17.3199 26.1062C16.5999 25.6795 15.4132 25.6795 14.6799 26.1062L10.6932 28.4662C7.83988 30.1595 6.10655 28.8929 6.85321 25.6662L7.79988 21.5729C7.97321 20.7995 7.66655 19.7195 7.10655 19.1595L3.79988 15.8529C1.85321 13.9062 2.47988 11.9329 5.19988 11.4795L9.45321 10.7729C10.1599 10.6529 11.0132 10.0262 11.3332 9.37287L13.6799 4.67953C14.9599 2.13286 17.0399 2.13286 18.3065 4.67953Z" fill="#FFC500" stroke="#FFC500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="rating-text-portfolio">{averageRating}</span>
                  </div>
                )}
                <p className="business-description-overlay">
                  {business.business_description || "No description available"}
                </p>
              </div>
            </div>
            
            <Slider {...settings}>
              {[...portfolioVideos, ...portfolioPics].map((item, index) => {
                const isVideo = portfolioVideos.includes(item);
                return (
                  <div key={index} className="portfolio-slide">
                    {isVideo ? (
                      <video
                        src={item}
                        className="portfolio-image video"
                        controls
                        muted
                        autoPlay
                        loop
                        playsInline
                        onClick={() => handleImageClick({ url: item, isVideo: true })}
                        style={{ cursor: 'pointer' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={item}
                        alt={`Portfolio ${index + 1}`}
                        className="portfolio-image"
                        onClick={() => handleImageClick({ url: item, isVideo: false })}
                        loading="lazy"
                      />
                    )}
                  </div>
                );
              })}
            </Slider>
            
            {/* Mobile Gallery Button */}
            {portfolioVideos.length + portfolioPics.length > 0 && (
              <div className="mobile-gallery-button-container">
                <button
                  className="see-all-button mobile"
                  onClick={() => navigate(`/portfolio/${businessId}/${business.business_name}/gallery`)}
                >
                  View Gallery
                </button>
              </div>
            )}
          </div>

          {/* Desktop Grid (hidden on mobile) */}
          <div className="portfolio-images-desktop">
            {/* Show first media item based on display_order */}
            {portfolioPics.length > 0 || portfolioVideos.length > 0 ? (
              // Get the first item from the combined and sorted media array
              (() => {
                const allMedia = [...portfolioVideos, ...portfolioPics];
                const firstMedia = allMedia[0];
                const isVideo = firstMedia && portfolioVideos.includes(firstMedia);

                if (isVideo) {
                  return (
                    <video
                      src={firstMedia}
                      className={`main-portfolio-image ${
                        portfolioVideos.length + portfolioPics.length <= 1
                        ? "single-media-item"
                        : ""
                      }`}
                      controls
                      muted
                      autoPlay
                      loop
                      playsInline
                      onClick={() => handleImageClick({ url: firstMedia, isVideo: true })}
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                } else if (firstMedia) {
                  return (
                    <img
                      src={firstMedia}
                      alt="Main Portfolio"
                      className={`main-portfolio-image ${
                        portfolioVideos.length + portfolioPics.length <= 1
                        ? "single-media-item"
                        : ""
                      }`}
                      onClick={() => handleImageClick({ url: firstMedia, isVideo: false })}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }
                return null;
              })()
            ) : (
              <img
                src="/images/portfolio.jpeg"
                alt="Default Portfolio"
                className="main-portfolio-image single-media-item"
              />
            )}

            {/* Show remaining media items in grid */}
            {portfolioVideos.length + portfolioPics.length > 1 && (
              <div className="portfolio-grid">
                {[...portfolioVideos, ...portfolioPics]
                  .slice(1, 5) // Show up to 4 more items (total of 5 including the first one)
                  .map((mediaItem, index) => {
                    const isVideo = portfolioVideos.includes(mediaItem);
                    return isVideo ? (
                      <video
                        key={index}
                        src={mediaItem}
                        className="portfolio-image-portfolio"
                        poster={`${mediaItem}?thumb`}
                        preload="metadata"
                        muted
                        autoPlay
                        loop
                        playsInline
                        onClick={() => handleImageClick({ url: mediaItem, isVideo: true })}
                        style={{ cursor: 'pointer' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        key={index}
                        src={mediaItem}
                        alt={`Portfolio ${index}`}
                        className="portfolio-image-portfolio"
                        onClick={() => handleImageClick({ url: mediaItem, isVideo: false })}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  })}
                {/* Always show gallery button if there are any media items */}
                {portfolioVideos.length + portfolioPics.length > 0 && (
                  <button
                    className="see-all-button"
                    onClick={() => navigate(`/portfolio/${businessId}/${business.business_name}/gallery`)}
                  >
                    View Gallery
                  </button>
                )}
              </div>
            )}

            {/* Show gallery button even when there's only one media item */}
            {portfolioVideos.length + portfolioPics.length === 1 && (
              <div className="portfolio-grid">
                <button
                  className="see-all-button"
                  onClick={() => navigate(`/portfolio/${businessId}/${business.business_name}/gallery`)}
                >
                  View Gallery
                </button>
              </div>
            )}

          </div>
          {isOwner && (
              <button
                className="edit-icon"
                onClick={() => openEditModal({ portfolio: { images: portfolioPics, videos: portfolioVideos } }, 'portfolio')}
              >
                ✎
              </button>
            )}

          <div className="section-container">
            <div className="section-left">
              <div className="business-header business-header-desktop">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div className="business-name">{business.business_name}</div>

                  {(business.is_verified ||
                    business.Bidi_Plus) && (
                    <div
                      className="verified-check-container"
                      onClick={handleCheckClick}
                    >
                      <div style={{ marginLeft: "4px", marginBottom: "14px" }}>
                        <VerifiedIcon />
                      </div>
                      <span className="verified-tooltip">
                        This business is verified by Bidi. You will have a 100%
                        money back guarantee if you pay through Bidi.
                      </span>
                    </div>
                  )}
                  {averageRating && (
                    <span className="vendor-rating-portfolio">
                      <div className="star-icon" style={{ width: "18px", height: "18px", marginBottom: "8px" }}>
                        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.3065 4.67953L20.6532 9.37287C20.9732 10.0262 21.8265 10.6529 22.5465 10.7729L26.7999 11.4795C29.5199 11.9329 30.1599 13.9062 28.1999 15.8529L24.8932 19.1595C24.3332 19.7195 24.0265 20.7995 24.1999 21.5729L25.1465 25.6662C25.8932 28.9062 24.1732 30.1595 21.3065 28.4662L17.3199 26.1062C16.5999 25.6795 15.4132 25.6795 14.6799 26.1062L10.6932 28.4662C7.83988 30.1595 6.10655 28.8929 6.85321 25.6662L7.79988 21.5729C7.97321 20.7995 7.66655 19.7195 7.10655 19.1595L3.79988 15.8529C1.85321 13.9062 2.47988 11.9329 5.19988 11.4795L9.45321 10.7729C10.1599 10.6529 11.0132 10.0262 11.3332 9.37287L13.6799 4.67953C14.9599 2.13286 17.0399 2.13286 18.3065 4.67953Z" fill="#FFC500" stroke="#FFC500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {averageRating}
                    </span>
                  )}
                </div>
                <p className="business-description">
                  {business.business_description || "No description available"}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                  }}
                >
                  {isOwner && (
                    <button
                      className="edit-icon"
                      onClick={() =>
                        openEditModal({
                          business_name: business.business_name,
                          business_description: business.business_description,
                        }, 'business_info')}
                    >
                      ✎
                    </button>
                  )}
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="business-details">
                <div className="business-detail">
                  <p className="detail-title">Location</p>
                  <div className="detail-content">

                    <div className="location-details">
                      <div className="location-primary">
                        <i className="fa-solid fa-location-dot"></i>
                        <div className="location-text">
                          {(!business.city_id && !business.county_id) && business.business_address && (
                            <p className="detail-text address">
                              {business.business_address}
                            </p>
                          )}
                          {business.city_id && (
                            <p className="detail-text city">
                              {business.city_id.split(' ').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </p>
                          )}
                          {business.county_id && (
                            <p className="detail-text county">
                              {business.county_id.split(' ').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')} County
                            </p>
                          )}
                        </div>
                      </div>
                      {business.service_areas && Array.isArray(business.service_areas) && business.service_areas.length > 0 && (
                        <div className="service-areas">
                          <button 
                            className="service-areas-toggle"
                            onClick={() => setShowServiceAreas(!showServiceAreas)}
                          >
                            {showServiceAreas ? 'Hide Additional Service Areas' : 'Show Additional Service Areas'}
                          </button>
                          {showServiceAreas && (
                            <div className="service-areas-content">
                              <h3 className="service-areas-title">Additional Service Areas</h3>
                              <div className="service-areas-list">
                                {business.service_areas.map((areaId, index) => (
                                  <span key={index} className="service-area-tag">
                                    {formatLocationName(areaId)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="edit-button" style={{ display: "flex", justifyContent: "flex-end", width: "100%", maxWidth: "50px" }}>
                      <button
                        className="edit-icon"
                        onClick={() =>
                          openEditModal({
                            business_address: business.business_address,
                            city_id: business.city_id,
                            county_id: business.county_id,
                            service_areas: business.service_areas,
                            latitude: business.latitude,
                            longitude: business.longitude
                          }, 'business_details')}
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>

                <div className="business-detail">
                  <p className="detail-title">Packages</p>
                  <div className="packages-container">
                    {packages.map((pkg, index) => (
                      <div key={index} className="package-card">
                        {pkg.image_url && (
                          <div className="package-image">
                            <img src={pkg.image_url} alt={pkg.name} />
                          </div>
                        )}
                        <div className="package-header">
                          <h3>{pkg.name}</h3>
                          <p className="package-price">${pkg.price}</p>
                        </div>
                        <div 
                          className="package-description"
                          dangerouslySetInnerHTML={{ __html: pkg.description || '' }}
                        />
                        {pkg.features && pkg.features.length > 0 && (
                          <ul className="package-features-portfolio">
                            {pkg.features.map((feature, featureIndex) => (
                              <li key={featureIndex}>{feature}</li>
                            ))}
                          </ul>
                        )}
                        <button 
                          className="learn-more-button"
                          onClick={() => handleLearnMore(pkg.name)}
                        >
                          <ChatIcon />
                          Learn More
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                  }}
                >
                  {isOwner && (
                    <button
                      className="edit-icon"
                      onClick={() =>
                        openEditModal({
                          packages: packages || [],
                        }, 'packages')}
                    >
                      ✎
                    </button>
                  )}
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="business-details">
                <div className="business-detail">
                  <p className="business-description">
                    Meet {business.business_name}
                  </p>
                </div>
                <div className="vendor-profile-container">
                  <div 
                    className="vendor-profile-left" 
                    onClick={() => handleImageClick({ 
                      url: convertedUrls.profile || profileImage, 
                      isVideo: false,
                      isProfile: true 
                    })} 
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={convertedUrls.profile || profileImage}
                      alt={`${business.business_name} profile`}
                      className="vendor-profile-image-portfolio"
                    />
                    <div className="vendor-profile-name">
                      {business.business_owner}
                    </div>
                    <div className="vendor-profile-owner">Owner</div>
                  </div>
                  <div className="vendor-profile-right">
                    <div 
                      className="vendor-profile-description"
                      dangerouslySetInnerHTML={{ __html: business.story || "No vendor description available" }}
                    />
                  </div>
                  {isOwner && (
                    <button
                      className="edit-icon"
                      style={{ position: "absolute", right: "10px", top: "10px" }}
                      onClick={() =>
                        openEditModal({
                          business_owner: business.business_owner,
                          story: business.story,
                          profile_picture: true,
                        }, 'profile')}
                    >
                      ✎
                    </button>
                  )}
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="section-container-specialties">
                <h2 className="section-header">Specialties</h2>
                <div className="specialties-section">
                  {business.specializations &&
                  business.specializations.length > 0 ? (
                    business.specializations.map((specialty, index) => (
                      <span key={index} className="specialty-item">
                        • {specialty}
                      </span>
                    ))
                  ) : (
                    <p className="no-specialties-text">No specialties yet.</p>
                  )}
                </div>
                {isOwner && (
                  <button
                    className="edit-icon"
                    onClick={() =>
                      openEditModal({
                        specializations: business.specializations,
                      }, 'specialties')}
                  >
                    ✎
                  </button>
                )}
              </div>
            </div>

            {!isOwner && (
              <div className="sticky-footer-wrapper">
                <div className="section-right sticky-footer">
                  {fromBid ? (
                    <div className="bid-info-container">
                      <h2 className="get-quote-header">Bid Information</h2>
                      <div className="bid-details">
                        <div className="bid-amount">
                          <span className="amount-label">Bid Amount:</span>
                          <span className="amount-value">${bidData?.amount}</span>
                        </div>
                        {bidData?.expirationDate && (
                          <div className="bid-expiration">
                            <span className="expiration-label">Expires:</span>
                            <span className="expiration-value">
                              {new Date(bidData.expirationDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="bid-status">
                          <span className="status-label">Status:</span>
                          <span className={`status-value ${bidData?.status?.toLowerCase()}`}>
                            {bidData?.status}
                          </span>
                        </div>
                        {bidData?.couponApplied && (
                          <div className="bid-coupon">
                            <span className="coupon-label">Coupon Applied:</span>
                            <div className="coupon-details">
                              <span className="coupon-code">{bidData.couponCode}</span>
                              <div className="price-breakdown">
                                <div className="price-row">
                                  <span>Original Price:</span>
                                  <span>${bidData.originalAmount?.toFixed(2)}</span>
                                </div>
                                <div className="price-row discount">
                                  <span>Discount:</span>
                                  <span>-${bidData.discountAmount?.toFixed(2)}</span>
                                </div>
                                <div className="price-row total">
                                  <span>Final Price:</span>
                                  <span>${bidData.amount?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="bid-description">
                          <span className="description-label">Description:</span>
                          <div 
                            ref={descriptionRef}
                            className={`description-content ${!isDescriptionExpanded ? 'description-collapsed' : ''}`}
                            style={{ maxHeight: isDescriptionExpanded ? 'none' : '100px' }}
                          >
                            <div dangerouslySetInnerHTML={{ __html: bidData?.description }} />
                          </div>
                          <button 
                            className="read-more-button"
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          >
                            {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                          </button>
                        </div>
                      </div>
                      <div className="business-actions">
                        <button 
                          className="btn-danger"
                          onClick={() => handleAction(handleDeny, bidData.id)}
                        >
                          Deny
                        </button>
                        <button
                          className="btn-success"
                          onClick={() => handleAction(handleApprove, bidData.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn-chat"
                          onClick={handleChatClick}
                        >
                          <ChatIcon style={{ fontSize: '20px' }} />
                          Chat
                        </button>
                      </div>
                    </div>
                  ) : fromVendorSelection ? (
                    <div className="get-a-bid-container">
                      <h2 className="get-quote-header">Add to Vendor List</h2>
                      <div className="vendor-button-container">
                        <button 
                          className={`vendor-button ${isSelected ? 'selected' : ''}`} 
                          onClick={handleToggleSelection}
                        >
                          {isSelected ? 'Selected ✓' : 'Add to Vendor List'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="get-a-bid-container">
                      <h2 className="get-quote-header">Chat with {business.business_name}</h2>
                      <div className="vendor-button-container" style={{ flexDirection: "column", gap: "16px",  }}>
                        <button 
                          className="vendor-button"
                          onClick={handleGetQuote}
                        >
                          Get a Tailored Bid
                        </button>
                        <button
                          className="vendor-button"
                          style={{ background: "#A328F4", color: "#fff" }}
                          onClick={handleChatClick}
                        >
                          <ChatIcon style={{ fontSize: '20px', marginRight: 6 }} />
                          Message
                        </button>
                                {isCalendarConnected && (
          <button
            className="vendor-button"
            style={{ background: "linear-gradient(90deg, #A328F4 0%, #e6007e 100%)", color: "#fff" }}
            onClick={handleConsultationClick}
          >
            <CalendarMonthIcon /> Schedule Consultation
          </button>
        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="section-divider"></div>

          {/* Reviews section moved outside section-container */}
          <div className="section-container-reviews">
            {/* Reviews Summary */}
            <div className="reviews-summary">
              <div className="reviews-summary-left">
                <div className="reviews-summary-title">Reviews</div>
                <div className="reviews-summary-rating-col">
                  <span className="reviews-summary-average">{averageRating || '—'} out of 5</span>
                  <div className="reviews-summary-stars">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="star-icon-portfolio">
                        {i < Math.round(averageRating) ? <StarIcon /> : <EmptyStarIcon />}
                      </div>
                    ))}
                  </div>
                  <span className="reviews-summary-count">
                    {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Write Review Box */}
            {!isOwner && (
              <div className="write-review-container">
                <div className="write-review-title">Rate the vendor and tell others what you think</div>
                <div className="star-and-write-review">
                  <div className="write-review-stars">
                    {[1,2,3,4,5].map((star) => (
                      <div
                        key={star}
                        className="star-icon-portfolio"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      >
                        {star <= newReview.rating ? <StarIcon /> : <EmptyStarIcon />}
                      </div>
                    ))}
                  </div>
                  <button className="write-review-button" onClick={openReviewModal}>
                    Write A Review
                  </button>
                </div>
              </div>
            )}

            {/* Reviews Grid */}
            <div className="reviews-grid">
              {reviews.length > 0 ? (
                reviews.map((review, index) => {
                  const truncated = review.comment && review.comment.length > 180;
                  const isExpanded = expandedReviews[index];
                  return (
                    <div key={index} className="review-card-portfolio">
                      <div className="review-card-header">
                        <div className="reviewer-initial">{review.first_name?.[0] || '?'}</div>
                        <div className="reviewer-details">
                          <span className="reviewer-name">{review.first_name}</span>
                          <span className="review-date">{new Date(review.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <div className="review-card-stars">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="review-star" style={{ gap:"8px", display:"flex", alignItems:"center" }}>
                              {i < review.rating ? <StarIcon /> : <EmptyStarIcon />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="review-card-content">
                        {truncated && !isExpanded
                          ? <>{review.comment.slice(0, 180)}... <span className="read-more-link" onClick={() => toggleReview(index)}>Read More</span></>
                          : <>{review.comment}{truncated && <span className="read-more-link" onClick={() => toggleReview(index)}> Show Less</span>}</>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-reviews">No reviews yet.</p>
              )}
            </div>

            {/* Google Reviews Section */}
            <GoogleReviews businessId={businessId} />
          </div>
        </div>
      </div>


      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSchedule={handleScheduleConsultation}
        businessName={business.business_name}
        businessId={businessId}
        bidId={null}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        availableTimeSlots={availableTimeSlots}
        isLoading={isConsultationLoading}
        error={consultationError}
        onDateSelect={handleDateSelect}
        onTimeSlotSelect={handleTimeSlotSelect}
        onFetchTimeSlots={fetchTimeSlots}
        businessTimezone={business.consultation_hours?.timezone || null}
      />

      {/* Add Calendar Reconnect Modal */}
      {showCalendarReconnectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Calendar Connection Required</h3>
            <p>Your Google Calendar connection needs to be refreshed. Would you like to reconnect now?</p>
            <div className="modal-buttons">
              <button 
                className="btn-secondary-consultation"
                onClick={() => setShowCalendarReconnectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary-consultation"
                onClick={handleCalendarReconnect}
              >
                Reconnect Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = `
.portfolio-back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  transition: all 0.2s ease;
}

.portfolio-back-button:hover {
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.portfolio-back-button i {
  font-size: 16px;
}

.mobile-gallery-button-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding: 0 16px;
}

.see-all-button.mobile {
  background: #A328F4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(163, 40, 244, 0.3);
}

.see-all-button.mobile:hover {
  background: #8a1fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 40, 244, 0.4);
}

.get-a-bid-container {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.get-quote-header {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.vendor-button-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vendor-button.selected {
  background: #4CAF50;
}

.vendor-button.selected:hover {
  background: #388e3c;
}

.location-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-primary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.location-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-icon {
  color: #7E7684;
  font-size: 18px;
  margin-top: 2px;
}

.detail-text {
  margin: 0;
  color: #333;
  font-size: 14px;
}

.detail-text.address {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
}

.detail-text.city {
  font-weight: 500;
  color: #333;
}

.detail-text.county {
  color: #666;
  font-size: 14px;
}

.service-areas {
  margin-top: 8px;
}

.service-areas-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.service-areas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-area-tag {
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}

.view-map-link {
  margin-top: 12px;
  color: #A328F4;
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.view-map-link:hover {
  background: #f0f0f0;
  text-decoration: none;
}

.view-map-link i {
  font-size: 16px;
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Portfolio;
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Portfolio.css";
import EditProfileModal from "./EditProfileModal"; // Import modal component
import Verified from "../../../assets/Frame 1162.svg"; // Import the verified icon
import StarIcon from "../../../assets/star-duotone.svg"; // Add this import
import ImageModal from "./ImageModal"; // Import the new ImageModal component
import EmptyStarIcon from "../../../assets/userpov-vendor-profile-star.svg"; // Import the empty star icon
import Modal from "react-modal"; // Import the modal library
import { convertHeicToJpeg } from "../../../utils/imageUtils";
import LoadingSpinner from "../../LoadingSpinner"; // Import the loading spinner component
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ChatIcon from '@mui/icons-material/Chat';
import AuthModal from "../../Request/Authentication/AuthModal";

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
            <img
              key={star}
              src={star <= rating ? StarIcon : EmptyStarIcon}
              alt={star <= rating ? 'Filled Star' : 'Empty Star'}
              className="star-icon-portfolio"
              style={{ cursor: 'pointer', width: 28, height: 28 }}
              onClick={() => setRating(star)}
            />
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

const Portfolio = ({ businessId: propBusinessId }) => {
  const { businessId: paramBusinessId } = useParams();
  const location = useLocation();
  const [businessId, setBusinessId] = useState(
    propBusinessId || paramBusinessId || null
  );
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [isOwner, setIsOwner] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [averageRating, setAverageRating] = useState(null);
  const [bidStats, setBidStats] = useState({ average: null, count: 0 });
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const [isIndividual, setIsIndividual] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // State for modal visibility
  const navigate = useNavigate();
  const [convertedUrls, setConvertedUrls] = useState({});
  const [sliderDimensions, setSliderDimensions] = useState({ width: 0, height: 0 });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fromBid, setFromBid] = useState(false);
  const [bidData, setBidData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const descriptionRef = useRef(null);

  // Add slider settings
  const sliderSettings = {
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: false,
    arrows: true,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    accessibility: true,
    draggable: true,
    swipe: true,
    touchMove: true,
    waitForAnimate: true,
    touchAction: 'pan-y',
    onInit: () => {
      const sliderContainer = document.querySelector('.portfolio-images');
      if (sliderContainer) {
        setSliderDimensions({
          width: sliderContainer.offsetWidth,
          height: sliderContainer.offsetHeight
        });
      }
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
        <span style={{ color: '#fff', fontSize: '20px' }}>←</span>
      </button>
    );
  }

  // Add function to render media items
  const renderMediaItem = (item, index) => {
    const isVideo = item.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm)$/);
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
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={convertedUrls[item] || item}
            alt={`Portfolio ${index + 1}`}
            className="portfolio-image"
            onClick={() => handleImageClick({ url: item, isVideo: false })}
            loading="lazy"
          />
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchBusinessId = async () => {
      if (businessId) return; // Skip if businessId is already set

      try {
        // Get the logged-in user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.error("Error fetching user:", error || "No user found.");
          return;
        }

        // Fetch the businessId from the business_profiles table
        const { data: profile, error: profileError } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("Error fetching business profile:", profileError);
          return;
        }

        setBusinessId(profile.id); // Set the businessId
      } catch (err) {
        console.error("Error fetching businessId:", err);
      }
    };

    fetchBusinessId();
  }, [businessId]);

  const fetchBusinessData = async () => {
    const { data: businessData, error: businessError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", businessId)
      .single();
    if (businessError) console.error("Error fetching business:", businessError);
    else setBusiness(businessData);

    const { data: profileData, error: profileError } = await supabase
      .from("profile_photos")
      .select("photo_url")
      .eq("user_id", businessId)
      .eq("photo_type", "profile")
      .single();
    if (profileData) setProfileImage(profileData.photo_url);
    else if (profileError)
      console.error("Error fetching profile image:", profileError);

    const { data: portfolioData, error: portfolioError } = await supabase
      .from("profile_photos")
      .select("photo_url, photo_type, display_order")
      .eq("user_id", businessId)
      .or("photo_type.eq.portfolio,photo_type.eq.video")
      .order("display_order", { ascending: true });

    if (portfolioError) {
      console.error("Error fetching portfolio media:", portfolioError);
    } else {
      // Sort by display_order
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!userError && user) {
      if (user.id === businessId) {
        setIsOwner(true);
      } else {
        const { data: userData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsIndividual(userData?.role === "individual");
      }
    }

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

    setLoading(false);

    // Helper function to normalize business_category
    const getCategories = (category) => Array.isArray(category) ? category : [category].filter(Boolean);

    if (businessData) {
      setBusiness({ ...businessData, business_category: getCategories(businessData.business_category) });
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
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    fetchBusinessData();
  };

  const handleCheckClick = (event) => {
    const tooltip = event.currentTarget.querySelector(".verified-tooltip");
    tooltip.style.visibility = "visible";
    tooltip.style.opacity = "1";
    tooltip.style.zIndex = "1000";
    setTimeout(() => {
      tooltip.style.visibility = "hidden";
      tooltip.style.opacity = "0";
      tooltip.style.zIndex = "1";
    }, 3000);
  };

  const handleGetQuote = () => {
    const vendorData = {
      vendor: business,
      image: profileImage,
    };

    // Format the category to match the expected format in RequestCategories.js
    const formattedCategory = business.business_category === 'wedding planner/coordinator' 
        ? 'WeddingPlanning'
        : business.business_category === 'beauty'
            ? 'HairAndMakeup'
            : business.business_category.charAt(0).toUpperCase() + 
              business.business_category.slice(1).toLowerCase();

    // Navigate to the master request flow with the vendor data and selected category
    navigate("/master-request-flow", { 
        state: { 
            vendor: vendorData,
            selectedCategories: [formattedCategory]
        }
    });
  };

  const handleImageClick = (media) => {
    // If media is already an object with url and isVideo properties
    if (media && typeof media === 'object' && 'url' in media) {
      setSelectedImage(media);
    } 
    // If media is just a URL string (for backward compatibility)
    else if (typeof media === 'string') {
      const isVideo = media.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm)$/);
      setSelectedImage({ url: media, isVideo: !!isVideo });
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
      alert("Please sign in to leave a review");
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
        alert("Unable to submit review. Please try again.");
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
        alert("Error posting review. Please try again.");
        return;
      }

      setNewReview({ rating: 5, comment: "" });
      closeReviewModal();
      fetchBusinessData();
    } catch (error) {
      console.error("Error in review submission:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleChatClick = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    navigate('/my-dashboard', {
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
    setIsAuthModalOpen(false);
    navigate('/my-dashboard', {
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
        alert('Failed to deny bid: Missing bid ID');
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
      alert('Failed to deny bid. Please try again.');
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
      alert('Failed to approve bid. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  if (!business) return <p>Error: Business not found.</p>;

  const categories = Array.isArray(business?.business_category)
    ? business.business_category
    : [business?.business_category].filter(Boolean);

  return (
    <>
      <EditProfileModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        businessId={businessId}
        initialData={editFields}
      />

      <ImageModal
        isOpen={!!selectedImage}
        mediaUrl={selectedImage?.url}
        isVideo={selectedImage?.isVideo}
        onClose={handleCloseImageModal}
      />

      {isAuthModalOpen && (
        <AuthModal 
          setIsModalOpen={setIsAuthModalOpen}
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
            <Slider {...sliderSettings}>
              {[...portfolioVideos, ...portfolioPics].map((item, index) => renderMediaItem(item, index))}
            </Slider>
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
                      src={convertedUrls[firstMedia] || firstMedia}
                      alt="Main Portfolio"
                      className={`main-portfolio-image ${
                        portfolioVideos.length + portfolioPics.length <= 1
                        ? "single-media-item"
                        : ""
                      }`}
                      onClick={() => handleImageClick({ url: firstMedia, isVideo: false })}
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
                  .map((item, index) => {
                    const isVideo = portfolioVideos.includes(item);
                    return isVideo ? (
                      <video
                        key={index}
                        src={item}
                        className="portfolio-image-portfolio"
                        poster={`${item}?thumb`}
                        preload="metadata"
                        muted
                        autoPlay
                        loop
                        playsInline
                        onClick={() => handleImageClick({ url: item, isVideo: true })}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        key={index}
                        src={convertedUrls[item] || item}
                        alt={`Portfolio ${index}`}
                        className="portfolio-image-portfolio"
                        onClick={() => handleImageClick({ url: item, isVideo: false })}
                      />
                    );
                  })}
                {portfolioPics.length + portfolioVideos.length > 5 && (
                  <button
                    className="see-all-button"
                    onClick={() => navigate(`/portfolio/${businessId}/gallery`)}
                  >
                    + See All
                  </button>
                )}
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
              <div className="business-header">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div className="business-name">{business.business_name}</div>

                  {(business.membership_tier === "Verified" ||
                    business.Bidi_Plus) && (
                    <div
                      className="verified-check-container"
                      onClick={handleCheckClick}
                    >
                      <img
                        style={{ marginLeft: "4px", marginBottom: "14px" }}
                        src={Verified}
                        alt="Verified"
                      />
                      <span className="verified-tooltip">
                        This business is verified by Bidi. You will have a 100%
                        money back guarantee if you pay through Bidi.
                      </span>
                    </div>
                  )}
                  {averageRating && (
                    <span className="vendor-rating-portfolio">
                      <img src={StarIcon} alt="Star" className="star-icon" />
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
                    <i className="fa-solid fa-location-dot detail-icon"></i>
                    <p className="detail-text">
                      {business.business_address || "Location not available"}
                    </p>
                  </div>
                </div>

                <div className="business-detail">
                  <p className="detail-title">Base Price</p>
                  <div className="detail-content">
                    <i className="fa-solid fa-dollar-sign detail-icon"></i>
                    <p className="detail-text">
                      {business.minimum_price || "Pricing Not Yet Set"}
                    </p>
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
                          business_address: business.business_address,
                          minimum_price: business.minimum_price,
                        }, 'business_details')}
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
                  <div className="vendor-profile-left" onClick={() => setSelectedImage({ url: convertedUrls.profile || profileImage, isVideo: false })} style={{ cursor: 'pointer' }}>
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
                    <p className="vendor-profile-description">
                      {business.story || "No vendor description available"}
                    </p>
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
                  ) : (
                    <div className="get-a-bid-container">
                      <h2 className="get-quote-header">Need a Bid?</h2>
                      <div className="vendor-button-container">
                        <button className="vendor-button" onClick={handleGetQuote}>
                          Get a Tailored Bid
                        </button>
                        <button className="chat-button" onClick={handleChatClick}>
                          <ChatIcon style={{ fontSize: '20px' }} />
                          Chat with Vendor
                        </button>
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
                      <img
                        key={i}
                        src={i < Math.round(averageRating) ? StarIcon : EmptyStarIcon}
                        alt="Star"
                        className="star-icon-portfolio"
                      />
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
                      <img
                        key={star}
                        src={star <= newReview.rating ? StarIcon : EmptyStarIcon}
                        alt={star <= newReview.rating ? 'Filled Star' : 'Empty Star'}
                        className="star-icon-portfolio"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      />
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
                            <img
                              key={i}
                              src={i < review.rating ? StarIcon : EmptyStarIcon}
                              alt="Star"
                              className="review-star"
                            />
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Portfolio;
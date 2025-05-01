import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const Portfolio = ({ businessId: propBusinessId }) => {
  const { businessId: paramBusinessId } = useParams();
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

    if (business.business_category === "photography") {
      navigate("/request/photography", { state: vendorData });
    } else if (business.business_category === "dj") {
      navigate("/request/dj", { state: vendorData });
    } else if (business.business_category === "florist") {
      navigate("/request/florist", { state: vendorData });
    } else if (business.business_category === "catering") {
      navigate("/request/catering", { state: vendorData });
    } else if (business.business_category === "videography") {
      navigate("/request/videography", { state: vendorData });
    } else if (business.business_category === "beauty") {
      navigate("/request/beauty", { state: vendorData });
    }
  };

  const handleImageClick = (media) => {
    // If media is already an object with url and isVideo properties
    if (media && typeof media === 'object' && 'url' in media) {
      setSelectedImage(media);
    } 
    // If media is just a URL string (for backward compatibility)
    else if (typeof media === 'string') {
      const isVideo = media.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm)$/);
      setSelectedImage({ url: media, isVideo });
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

  if (loading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  if (!business) return <p>Error: Business not found.</p>;

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

            {isOwner && (
              <button
                className="edit-icon"
                onClick={() => openEditModal({ portfolio: { images: portfolioPics, videos: portfolioVideos } }, 'portfolio')}
              >
                ✎
              </button>
            )}
          </div>

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
                  <div className="vendor-profile-left">
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
                  <div className="get-a-bid-container">
                    <h2 className="get-quote-header">Need a Bid?</h2>
                    <div className="vendor-button-container">
                      <button className="vendor-button" onClick={handleGetQuote}>
                        Get a Tailored Bid
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="section-divider"></div>

          {/* Reviews section moved outside section-container */}
          <div className="section-container-reviews">
            <div className="reviews-header">
              <h2 className="section-header">Reviews</h2>
              {averageRating && (
                <div className="reviews-average">
                  <div className="rating-stars">
                    <span className="average-rating">
                      {averageRating} out of 5
                    </span>
                    <div className="stars-container">
                      {[...Array(5)].map((_, index) => (
                        <img
                          key={index}
                          src={StarIcon}
                          alt="Star"
                          className={`star-icon-portfolio ${
                            index < Math.floor(averageRating)
                              ? "star-filled"
                              : "star-empty"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="review-count">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
            {isIndividual && !isOwner && (
              <div className="write-review-container">
                <p className="write-review-title" style={{ textAlign: "left" }}>
                  Rate the vendor and tell others what you think
                </p>
                <div className="star-and-write-review">
                  <div className="write-review-stars">
                    {[...Array(5)].map((_, index) => (
                      <img
                        key={index}
                        src={EmptyStarIcon}
                        alt="Star"
                        className={`star-icon-portfolio ${
                          index < newReview.rating ? "star-filled" : "star-empty"
                        }`}
                        onClick={() =>
                          setNewReview({ ...newReview, rating: index + 1 })
                        }
                        style={{
                          cursor: "pointer",
                          height: "28px",
                          width: "28px",
                        }}
                      />
                    ))}
                  </div>
                  <button
                    className="write-review-button"
                    onClick={openReviewModal}
                  >
                    Write A Review
                  </button>
                </div>
              </div>
            )}

            {/* Review Modal */}
            <Modal
              isOpen={isReviewModalOpen}
              onRequestClose={closeReviewModal}
              className="review-modal"
              overlayClassName="review-modal-overlay"
              ariaHideApp={false}
            >
              <h2 className="modal-title">Write a Review</h2>
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="rating-input">
                  {[...Array(5)].map((_, index) => (
                    <img
                      key={index}
                      src={StarIcon}
                      alt="Star"
                      className={`star-icon-portfolio ${
                        index < newReview.rating ? "star-filled" : "star-empty"
                      }`}
                      onClick={() =>
                        setNewReview({ ...newReview, rating: index + 1 })
                      }
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  placeholder="Write your review here..."
                  required
                  className="review-textarea"
                />
                <div className="modal-buttons">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closeReviewModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-review-btn">
                    Submit Review
                  </button>
                </div>
              </form>
            </Modal>

            <div className="reviews-section">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <div className="review-info">
                        <h4 className="reviewer-name">{review.first_name}</h4>
                        <span className="review-date">
                          {" "}
                          - {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, starIndex) => (
                          <img
                            key={starIndex}
                            src={StarIcon}
                            alt="Star"
                            className={`star-icon-portfolio ${
                              starIndex < review.rating
                                ? "star-filled"
                                : "star-empty"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-text">
                      {expandedReviews[index]
                        ? review.comment
                        : review.comment.length > 150
                        ? `${review.comment.substring(0, 150)}...`
                        : review.comment}
                    </p>
                    {review.comment.length > 150 && (
                      <button
                        onClick={() => toggleReview(index)}
                        className="read-more-reviews"
                      >
                        {expandedReviews[index] ? "Read Less" : "Read More"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Portfolio;

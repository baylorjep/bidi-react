import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Portfolio.css";
import EditProfileModal from "./EditProfileModal"; // Import modal component
import Verified from '../../../assets/Frame 1162.svg'; // Import the verified icon
import StarIcon from '../../../assets/star-duotone.svg'; // Add this import
import ImageModal from "./ImageModal"; // Import the new ImageModal component

const Portfolio = () => {
  const { businessId } = useParams();
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
  const navigate = useNavigate();

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
    else if (profileError) console.error("Error fetching profile image:", profileError);

    const { data: portfolioData, error: portfolioError } = await supabase
      .from("profile_photos")
      .select("photo_url")
      .eq("user_id", businessId)
      .eq("photo_type", "portfolio");
    if (portfolioError) console.error("Error fetching portfolio images:", portfolioError);
    else setPortfolioPics(portfolioData.map(img => img.photo_url));

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!userError && user && user.id === businessId) {
      setIsOwner(true);
    }

    // Add this section to fetch reviews
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .select('rating, first_name')
      .eq('vendor_id', businessId);

    if (reviewError) {
      console.error('Error fetching reviews:', reviewError);
    } else {
      const avgRating = reviewData.length > 0
        ? (reviewData.reduce((acc, review) => acc + review.rating, 0) / reviewData.length).toFixed(1)
        : null;
      setAverageRating(avgRating);
    }

    // Modified bid fetching and calculation
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .select('bid_amount')
      .eq('user_id', businessId);

    if (bidError) {
      console.error('Error fetching bids:', bidError);
    } else if (bidData && bidData.length > 0) {
      const totalBids = bidData.reduce((acc, bid) => acc + bid.bid_amount, 0);
      const averageBid = (totalBids / bidData.length).toFixed(0);
      setBidStats({
        average: averageBid,
        count: bidData.length
      });
    }

    // Fetch full review data including ratings, comments, first name, and created_at
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, comment, first_name, created_at')
      .eq('vendor_id', businessId);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    } else {
      setReviews(reviewsData);
      // Calculate average rating from the full reviews data
      const avgRating = reviewsData.length > 0
        ? (reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length).toFixed(1)
        : null;
      setAverageRating(avgRating);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  const openEditModal = (fields) => {
    setEditFields(fields);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    fetchBusinessData(); // Refresh data after modal closes
  };

  const handleCheckClick = (event) => {
    const tooltip = event.currentTarget.querySelector('.verified-tooltip');
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
    tooltip.style.zIndex = '1000'; // Ensure the tooltip is on top
    setTimeout(() => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        tooltip.style.zIndex = '1'; // Reset z-index
    }, 3000);
  };

  const handleGetQuote = () => {
    const vendorData = {
      vendor: business,
      image: profileImage
    };
  
    if (business.business_category === 'photography') { 
      navigate('/request/photography', { state: vendorData });
    } else if (business.business_category === 'dj') {
      navigate('/request/dj', { state: vendorData });
    } else if (business.business_category === 'florist') {
      navigate('/request/florist', { state: vendorData });
    } else if (business.business_category === 'catering') {
      navigate('/request/catering', { state: vendorData });
    } else if (business.business_category === 'videography') {
      navigate('/request/videography', { state: vendorData });
    }
    else if (business.business_category === 'beauty') {
      navigate('/request/beauty', { state: vendorData });
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) return <p>Loading portfolio...</p>;
  if (!business) return <p>Error: Business not found.</p>;

  return (
    <>
      <EditProfileModal
        isOpen={modalOpen}
        onClose={handleModalClose} // Use the new handler
        businessId={businessId}
        initialData={editFields}
      />

      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage}
        onClose={handleCloseImageModal}
      />

      <div className="portfolio-container">
        <div className="portfolio-layout">
          {portfolioPics.length === 1 ? (
            <img 
              src={portfolioPics[0]} 
              alt="Main Portfolio" 
              className="single-portfolio-image" 
              onClick={() => handleImageClick(portfolioPics[0])}
            />
          ) : (
            <>
              <img 
                src={portfolioPics.length > 0 ? portfolioPics[0] : "/images/portfolio.jpeg"} 
                alt="Main Portfolio" 
                className="main-portfolio-image" 
                onClick={() => handleImageClick(portfolioPics[0])}
              />
              <div className="portfolio-grid">
                {portfolioPics.length > 0
                  ? portfolioPics.slice(1, 5).map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Portfolio ${index}`}
                        className="portfolio-image-portfolio"
                        onClick={() => handleImageClick(img)}
                      />
                    ))
                  : Array.from({ length: 4 }).map((_, index) => (
                      <img key={index} src="/images/portfolio.jpeg" alt={`Default ${index}`} className="portfolio-image" />
                    ))}
                {portfolioPics.length > 5 && (
                  <button className="see-all-button" onClick={() => navigate(`/portfolio/${businessId}/gallery`)}>
                    + See All
                  </button>
                )}
              </div>
            </>
          )}
          {isOwner && (
            <button className="edit-icon" onClick={() => openEditModal({ portfolio: portfolioPics })}>
              ✎
            </button>
          )}
        </div>
        <div className="section-container">
          
          <div className="section-left">

            <div className="business-header">

              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>

                <div className="business-name">
                  {business.business_name}
                </div>

                {averageRating && (
                  <span className="vendor-rating-portfolio">
                    <img src={StarIcon} alt="Star" className="star-icon" />
                    {averageRating}
                  </span>
                )}
                {(business.membership_tier === 'Verified' || business.Bidi_Plus) && (
                  <div className="verified-check-container" onClick={handleCheckClick}>
                    <img style={{ marginLeft: '4px', marginBottom: '14px' }} src={Verified} alt="Verified" />
                    <span className="verified-tooltip">
                      This business is verified by Bidi. You will have a 100% money back guarantee if you pay through Bidi.
                    </span>

                  </div>
                )}

              </div>
              <p className="business-description">{business.business_description || "No description available"}</p>
              <div style={{ display: 'flex', justifyContent:'flex-end', width: '100%' }}>
                  {isOwner && (
                <button className="edit-icon" onClick={() => openEditModal({
                  business_name: business.business_name,
                  business_description: business.business_description
                })}>
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
                  <p className="detail-text">{business.business_address || "Location not available"}</p>
                </div>
              </div>

              <div className="business-detail">
                <p className="detail-title">Base Price</p>
                <div className="detail-content">
                  <i className="fa-solid fa-dollar-sign detail-icon"></i>
                  <p className="detail-text">{business.minimum_price || "Pricing Not Yet Set"}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent:'flex-end', width: '100%' }}>
              {isOwner && (
            <button className="edit-icon" onClick={() => openEditModal({
              business_address: business.business_address,
              minimum_price: business.minimum_price
            })}>
              ✎
            </button>
          )}
          </div>
            </div>

            <div className="section-divider"></div>

            <div className="business-details">
              <div className="business-detail">
                <p className="business-description">Meet {business.business_name}</p>
              </div>
              <div className="vendor-profile-container">

                <div className="vendor-profile-left">
                  <img 
                    src={profileImage} 
                    alt={`${business.business_name} profile`} 
                    className="vendor-profile-image"
                  />
                  <div className="vendor-profile-name">{business.business_owner}</div>
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
                    style={{  right: '10px', top: '10px' }}
                    onClick={() => openEditModal({
                      business_owner: business.business_owner,
                      story: business.story
                    })}
                  >
                    ✎
                  </button>
                )}
              </div>
            </div>

            <div className="section-right">
            <h2 className="get-quote-header">Need a Bid?</h2>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
              <button 
                className="vendor-button" 
                onClick={handleGetQuote}
              >
                Get a Tailored Bid
              </button>
            </div>
          </div>

            <div className="section-divider"></div> 

            {business.specializations && business.specializations.length > 0 && (
              <div className="section-container-specialties">

                <h2 className="section-header">Specialties</h2>
                <div className="specialties-section">
                  {business.specializations.map((specialty, index) => (
                    <span key={index} className="specialty-item">• {specialty}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent:'flex-end', width: '100%' }}>
                {isOwner && (
                  <button className="edit-icon" onClick={() => openEditModal({
                    specializations: business.specializations
                  })}>
                    ✎
                  </button>
                )}
                </div>
              </div>
            )}

            <div className="section-divider"></div>

            {/* 🔹 SECTION 4: Reviews */}
            <div className="section-container-reviews">
              <div className="reviews-header">
                <h2 className="section-header">Reviews</h2>
                {averageRating && (
                  <div className="reviews-average">
                    <div className="rating-stars">
                      <span className="average-rating">{averageRating} out of 5</span>
                      <div className="stars-container">
                        {[...Array(5)].map((_, index) => (
                          <img
                            key={index}
                            src={StarIcon}
                            alt="Star"
                            className={`star-icon-portfolio ${
                              index < Math.floor(averageRating) ? 'star-filled' : 'star-empty'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="review-count">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
              <div className="reviews-section">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="review-info">
                          <h4 className="reviewer-name">{review.first_name}</h4>
                          <span className="review-date"> - {new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="review-rating">
                          {[...Array(5)].map((_, starIndex) => (
                            <img
                              key={starIndex}
                              src={StarIcon}
                              alt="Star"
                              className={`star-icon-portfolio ${
                                starIndex < review.rating ? 'star-filled' : 'star-empty'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{review.comment}</p>
                      <a href="#" className="read-more">Read More</a>
                    </div>
                  ))
                ) : (
                  <p>No reviews yet</p>
                )}
              </div>
            </div>
 
          </div>


        </div>
      </div>
    </>
  );
};

export default Portfolio;
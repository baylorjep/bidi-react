import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // Import your Supabase client
import bidiCheck from "../../assets/Frame 1162.svg";
import StarIcon from "../../assets/star-duotone.svg";
import { Link, useNavigate } from "react-router-dom";
import "./BidDisplay.css";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';

function BidDisplay({ 
  bid, 
  handleApprove, 
  handleDeny, 
  showActions = true,
  showPaymentOptions = false,
  showReopen = false,
  downPayment = null,
  onDownPayment = null,
  onMessage = null,
  onViewCoupon = null
}) {
  const [isBidiVerified, setIsBidiVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [showBubble, setShowBubble] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;
    
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired' };
    if (diffDays <= 1) return { status: 'urgent', text: 'Expires today' };
    if (diffDays <= 3) return { status: 'warning', text: `Expires in ${diffDays} days` };
    return { status: 'normal', text: `Expires in ${diffDays} days` };
  };

  const expirationStatus = getExpirationStatus(bid.expiration_date);

  const handleProfileClick = () => {
    setShowBubble(false); // Hide the bubble when the profile image is clicked
    navigate(`/portfolio/${bid.business_profiles.id}`);
  };

  const profileImage =
    bid.business_profiles.profile_image || "/images/default.jpg"; // Default image if none

  useEffect(() => {
    const fetchMembershipTier = async () => {
      try {
        // Log to ensure bid ID is valid
        console.log(
          "Fetching membership tier for business profile ID:",
          bid.business_profiles.id
        );

        // Fetch membership-tier for this bid's associated business profile
        const { data, error } = await supabase
          .from("business_profiles") // Replace with your actual table name
          .select("membership_tier, down_payment_type, amount")
          .eq("id", bid.business_profiles.id) // Match the business profile ID
          .single();

        // Log the response to check the data
        console.log("Supabase response:", data, error);

        if (error) {
          throw error;
        }

        // Check if membership-tier is "Plus" or "Verified"
        const tier = data?.["membership_tier"];
        setIsBidiVerified(tier === "Plus" || tier === "Verified");
      } catch (error) {
        console.error("Error fetching membership tier:", error.message);
        setError("Failed to fetch membership tier"); // Set a friendly error message
      } finally {
        setLoading(false); // Set loading to false once the fetch is complete
      }
    };

    fetchMembershipTier();
  }, [bid.business_profiles.id]);

  // Simplified review fetching
  useEffect(() => {
    const fetchRating = async () => {
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("vendor_id", bid.business_profiles.id);

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
    };

    fetchRating();
  }, [bid.business_profiles.id]);

  const handleAction = (action, id) => {
    setIsAnimating(true);
    setTimeout(() => {
      action(id);
    }, 300); // Match this with the CSS animation duration
  };

  const renderActionButtons = () => {
    if (!showActions) return null;

    const renderChatButton = (onClick) => (
      <button
        className="btn-chat"
        onClick={() => {
          console.log("Opening chat with business:", bid.business_profiles.id);
          if (onMessage) {
            onMessage({
              id: bid.business_profiles.id,
              name: bid.business_profiles.business_name,
              profileImage: bid.business_profiles.profile_image
            });
          }
        }}
      >
        <ChatIcon />
        Chat
      </button>
    );

    if (showPaymentOptions) {
      return (
        <div className="business-actions">
          <button 
            className="btn-danger"
            onClick={() => handleAction(handleApprove, bid.id)}
          >
            Move to Pending
          </button>
          {downPayment && (
            <button
              className="btn-success"
              onClick={() => handleAction(onDownPayment, bid)}
            >
              Pay Deposit
            </button>
          )}
          <button
            className="btn-success"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            Pay Full
          </button>
          {renderChatButton()}
        </div>
      );
    }

    if (showReopen) {
      return (
        <div className="business-actions">
          <button 
            className="btn-danger"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            Move to Pending
          </button>
          <button
            className="btn-success"
            onClick={() => handleAction(handleApprove, bid.id)}
          >
            Accept
          </button>
          {renderChatButton()}
        </div>
      );
    }

    return (
      <div className="business-actions">
        <button 
          className="btn-danger"
          onClick={() => handleAction(handleDeny, bid.id)}
        >
          Deny
        </button>
        <button
          className="btn-success"
          onClick={() => handleAction(handleApprove, bid.id)}
        >
          Accept
        </button>
        {renderChatButton()}
      </div>
    );
  };

  return (
    <div className={`request-display ${isAnimating ? 'fade-out' : ''}`}>
      <div className="bid-display-head-container">
        <div className="request-title">
          <div className="bid-display-head">
            <div className="profile-image-container">
              <img
                src={profileImage}
                alt={`${bid.business_profiles.business_name} profile`}
                className="vendor-profile-image"
                onClick={handleProfileClick}
              />
              <div
                className="profile-tooltip"
                style={{
                  display: showBubble ? "block" : "none",
                }}
              >
                Click to view profile
              </div>
            </div>
            <div className="business-info">
              <Link
                to={`/portfolio/${bid.business_profiles.id}`}
                className="business-name-bid-display"
              >
                {bid.business_profiles.business_name}
              </Link>
              <div className="business-badges">
                {isBidiVerified && (
                  <img
                    src={bidiCheck}
                    className="bidi-check-icon"
                    alt="Bidi Verified Icon"
                  />
                )}
                {averageRating && (
                  <span className="vendor-rating">
                    <img src={StarIcon} alt="Star" className="star-icon" />
                    {averageRating}
                  </span>
                )}
                {bid.isNew && (
                  <span className="new-badge">New</span>
                )}
              </div>
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            isBidiVerified && (
              <div className="bidi-verified-info">
                <p className="bidi-verified-title">
                  Bidi Verified
                </p>
                <p className="bidi-verified-subtitle">
                  100% Money-Back Guarantee When You Pay Through Bidi
                </p>
              </div>
            )
          )}
        </div>
        <div className="bid-display-btn-container">
          <div className="bid-amount-container">
            <button className="bid-display-button" disabled>
              ${bid.bid_amount}
              <div className="tag-hole"></div>
            </button>
            {expirationStatus && (
              <div className={`expiration-badge ${expirationStatus.status}`}>
                <AccessTimeIcon />
                {expirationStatus.text}
              </div>
            )}
          </div>
        </div>
      </div>
      <hr />
      <div className="request-content">
        <p className="request-category">
          <strong>Category:</strong> {bid.business_profiles.business_category}
        </p>
        <p className="request-description">
          <strong>Description:</strong>{" "}
          <div 
            className="bid-description-content"
            dangerouslySetInnerHTML={{ __html: bid.bid_description }}
          />
        </p>
        {downPayment && (
          <p className="request-comments">
            <strong>Down Payment:</strong>{" "}
            {downPayment.display}
          </p>
        )}
        {bid.coupon_code && (
          <div className="coupon-section">
            <button
              className="btn-secondary"
              onClick={() => onViewCoupon(bid)}
            >
              <i className="fas fa-ticket-alt"></i>
              View Applied Coupon
            </button>
          </div>
        )}
        {bid.coupon_applied && (
          <div className="coupon-applied-info">
            <strong>Coupon Applied:</strong> {bid.coupon_code}
            <br />
            <strong>Original Price:</strong> ${(bid.original_amount || 0).toFixed(2)}
            <br />
            <strong>Discount:</strong> ${(bid.discount_amount || 0).toFixed(2)}
            <br />
            <strong>Final Price:</strong> ${(bid.bid_amount || 0).toFixed(2)}
          </div>
        )}
      </div>

      <div className="action-buttons-spacer"></div>
      {renderActionButtons()}
    </div>
  );
}

export default BidDisplay;

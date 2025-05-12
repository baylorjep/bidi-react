import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // Import your Supabase client
import bidiCheck from "../../assets/Frame 1162.svg";
import StarIcon from "../../assets/star-duotone.svg";
import { Link, useNavigate } from "react-router-dom";
import "./BidDisplay.css";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

function BidDisplay({ 
  bid, 
  handleApprove, 
  handleDeny, 
  handleInterested,
  handlePending,
  showActions = true,
  showPaymentOptions = false,
  showReopen = false,
  showInterested = false,
  showNotInterested = false,
  showPending = false,
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showVerifiedTooltip, setShowVerifiedTooltip] = useState(false);
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
    setShowBubble(false);
    navigate(`/portfolio/${bid.business_profiles.id}`, {
      state: {
        fromBid: true,
        bidId: bid.id,
        bidData: {
          amount: bid.bid_amount,
          description: bid.bid_description,
          expirationDate: bid.expiration_date,
          status: bid.status,
          couponCode: bid.coupon_code,
          couponApplied: bid.coupon_applied,
          originalAmount: bid.original_amount,
          discountAmount: bid.discount_amount
        }
      }
    });
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
    if (typeof action === 'function') {
      setIsAnimating(true);
      setTimeout(() => {
        action(id);
      }, 300); // Match this with the CSS animation duration
    }
  };

  const renderChatButton = () => (
    <button
      className="btn-icon"
      onClick={() => {
        console.log("Opening chat with business:", bid.business_profiles.id);
        
        if (onMessage) {
          onMessage({
            id: bid.business_profiles.id,
            name: bid.business_profiles.business_name,
            profileImage: bid.business_profiles.profile_image
          });
        }

        setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
          });
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
          
          if (window.innerWidth <= 768) {
            window.scrollTo(0, 0);
            document.body.scrollIntoView({ behavior: 'instant' });
          }
        }, 100);
      }}
    >
      <ChatIcon />
    </button>
  );

  const renderActionButtons = () => {
    if (!showActions) return null;

    if (showPaymentOptions) {
      return (
        <div className="business-actions">
          <button
            className="btn-icon"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            <CancelIcon />
          </button>
          {downPayment && (
            <button
              className="btn-icon"
              onClick={() => handleAction(onDownPayment, bid)}
            >
              Pay Deposit
            </button>
          )}
          <button
            className="btn-icon"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            Pay Full
          </button>
          {renderChatButton()}
        </div>
      );
    }

    if (showInterested) {
      return (
        <div className="business-actions-bid-display">
          <button
            className="btn-icon"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            <CancelIcon />
          </button>
          <button
            className="btn-icon"
            onClick={() => handleAction(handleInterested, bid.id)}
          >
            <FavoriteIcon />
          </button>
          <button 
            className="btn-icon"
            onClick={() => {
              if (handleApprove) {
                handleApprove(bid.id);
              }
            }}
          >
            <CheckCircleIcon />
          </button>
          {renderChatButton()}
        </div>
      );
    }

    if (showNotInterested) {
      return (
        <div className="business-actions-bid-display">
          <button
            className="btn-icon"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            <AccessTimeIcon />
          </button>
          <button
            className="btn-icon"
            onClick={() => handleAction(handleInterested, bid.id)}
          >
            <FavoriteBorderIcon />
          </button>
          {renderChatButton()}
        </div>
      );
    }

    if (showPending) {
      return (
        <div className="business-actions-bid-display">
          <button
            className="btn-icon"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            <CancelIcon />
          </button>
          <button
            className="btn-icon"
            onClick={() => handleAction(handleInterested, bid.id)}
          >
            <FavoriteBorderIcon />
          </button>
          {renderChatButton()}
        </div>
      );
    }

    // Default case - only show X, heart, and chat
    return (
      <div className="business-actions-bid-display">
        <button
          className="btn-icon"
          onClick={() => handleAction(handleDeny, bid.id)}
        >
          <CancelIcon />
        </button>
        <button
          className="btn-icon"
          onClick={() => handleAction(handleInterested, bid.id)}
        >
          <FavoriteBorderIcon />
        </button>
        {renderChatButton()}
      </div>
    );
  };

  return (
    <div className={`request-display bid-display ${isAnimating ? 'fade-out' : ''}`}>
      {showActions && (
        <div className="business-actions-bid-display">
          {showPaymentOptions ? (
            <>
              <button
                className="btn-icon btn-danger"
                onClick={() => handleAction(handleDeny, bid.id)}
              >
                <CancelIcon />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleAction(handleInterested, bid.id)}
              >
                <FavoriteBorderIcon />
              </button>
              <button 
                className="btn-icon"
                onClick={() => handleAction(handleApprove, bid.id)}
              >
                <AccessTimeIcon />
              </button>
              {renderChatButton()}
            </>
          ) : showReopen ? (
            <>
              <button 
                className="btn-icon btn-success"
                onClick={() => handleAction(handleApprove, bid.id)}
              >
                <CheckCircleIcon />
              </button>
              <button
                className="btn-icon btn-success"
                onClick={() => handleAction(handleDeny, bid.id)}
              >
                <CheckCircleIcon />
              </button>
              {renderChatButton()}
            </>
          ) : showInterested ? (
            <>
              <button
                className="btn-icon btn-danger"
                onClick={() => handleAction(handleDeny, bid.id)}
              >
                <CancelIcon />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleAction(handleInterested, bid.id)}
              >
                <FavoriteIcon />
              </button>
              <button 
                className="btn-icon"
                onClick={() => {
                  if (handleApprove) {
                    handleApprove(bid.id);
                  }
                }}
              >
                <CheckCircleIcon />
              </button>
              {renderChatButton()}
            </>
          ) : showNotInterested ? (
            <>
              <button
                className="btn-icon"
                onClick={() => handleAction(handleDeny, bid.id)}
              >
                <AccessTimeIcon />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleAction(handleInterested, bid.id)}
              >
                <FavoriteBorderIcon />
              </button>
              {renderChatButton()}
            </>
          ) : showPending ? (
            <>
              <button
                className="btn-icon btn-danger"
                onClick={() => handleAction(handleDeny, bid.id)}
              >
                <CancelIcon />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleAction(handleInterested, bid.id)}
              >
                <FavoriteBorderIcon />
              </button>
              {renderChatButton()}
            </>
          ) : (
            <>
              <button
                className="btn-icon btn-danger"
                onClick={() => handleAction(handleDeny, bid.id)}
              >
                <CancelIcon />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleAction(handleInterested, bid.id)}
              >
                <FavoriteBorderIcon />
              </button>
              {renderChatButton()}
            </>
          )}
        </div>
      )}
      <div className="bid-display-head-container">
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
            <div className="business-name-container">
              <Link
                to={`/portfolio/${bid.business_profiles.id}`}
                className="business-name-bid-display"
              >
                {bid.business_profiles.business_name}
              </Link>
              {isBidiVerified && (
                <div 
                  className="bidi-verified-compact"
                  onMouseEnter={() => setShowVerifiedTooltip(true)}
                  onMouseLeave={() => setShowVerifiedTooltip(false)}
                  onClick={() => setShowVerifiedTooltip(!showVerifiedTooltip)}
                >
                  <img
                    src={bidiCheck}
                    className="bidi-check-icon"
                    alt="Bidi Verified Icon"
                  />
                  <span>Verified</span>
                  <div className={`verified-tooltip ${showVerifiedTooltip ? 'show' : ''}`}>
                    <p className="verified-tooltip-title">Bidi Verified</p>
                    <p className="verified-tooltip-subtitle">100% Money-Back Guarantee When You Pay Through Bidi</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bid-amount-section">
              <div className="bid-amount-container">
                <button className="bid-display-button" disabled>
                  ${bid.bid_amount}
                  <div className="tag-hole"></div>
                </button>
              </div>
            </div>
            <div className="business-badges">
              {averageRating && (
                <span className="vendor-rating">
                  <img src={StarIcon} alt="Star" className="star-icon" />
                  {averageRating}
                </span>
              )}
              {bid.isNew && (
                <span className="new-badge">New</span>
              )}
              {expirationStatus && (
                <div className={`expiration-badge ${expirationStatus.status}`}>
                  <AccessTimeIcon />
                  {expirationStatus.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentOptions && (
        <div className="payment-options">
          {downPayment && (
            <button
              className="payment-button deposit"
              onClick={() => handleAction(onDownPayment, bid)}
            >
              Pay Deposit (${downPayment.amount})
            </button>
          )}
          <button
            className="payment-button full"
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            Pay Full Amount (${bid.bid_amount})
          </button>
        </div>
      )}

      <div className="request-content">
        <p className="request-description">
          <strong>Description:</strong>{" "}
          <div 
            className={`bid-description-content ${!isDescriptionExpanded ? 'description-collapsed' : ''}`}
            dangerouslySetInnerHTML={{ __html: bid.bid_description }}
          />
          {bid.bid_description.length > 200 && (
            <button 
              className="read-more-btn"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {isDescriptionExpanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </p>
        {downPayment && !showPaymentOptions && (
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
    </div>
  );
}

export default BidDisplay;

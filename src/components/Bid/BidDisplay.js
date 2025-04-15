import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // Import your Supabase client
import bidiCheck from "../../assets/Frame 1162.svg";
import StarIcon from "../../assets/star-duotone.svg";
import { Link, useNavigate } from "react-router-dom";
import "./BidDisplay.css";

function BidDisplay({ bid, handleApprove, handleDeny }) {
  const [isBidiVerified, setIsBidiVerified] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [downPayment, setDownPayment] = useState(null); // New state for down payment
  const [downPaymentAmount, setDownPaymentAmount] = useState(null); // New state for down payment
  const [showBubble, setShowBubble] = useState(true); // State to control the visibility of the bubble
  const [averageRating, setAverageRating] = useState(null);
  const navigate = useNavigate();
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
        setDownPayment(data?.["down_payment_type"]);
        setDownPaymentAmount(data?.["amount"]);
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

  return (
    <div className="request-display">
      <div className="bid-display-head-container">
        <div
          className="request-title"
          style={{ marginBottom: "0", textAlign: "left", position: "relative" }}
        >
          <div className="bid-display-head">
            <div style={{ position: "relative" }}>
              <img
                src={profileImage}
                alt={`${bid.business_profiles.business_name} profile`}
                className="vendor-profile-image"
                onClick={handleProfileClick}
                style={{
                  cursor: "pointer",
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                }}
                title="Click to view full profile"
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
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Link
                to={`/portfolio/${bid.business_profiles.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: "bold",
                }}
              >
                {bid.business_profiles.business_name}
              </Link>
              {isBidiVerified && (
                <img
                  src={bidiCheck}
                  style={{ height: "20px", width: "auto" }}
                  alt="Bidi Verified Icon"
                />
              )}
              {averageRating && (
                <span className="vendor-rating">
                  <img src={StarIcon} alt="Star" className="star-icon" />
                  {averageRating}
                </span>
              )}
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            isBidiVerified && (
              <div
                style={{
                  textAlign: "left",
                  padding: "0px 0px",
                  marginTop: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    margin: "0",
                    fontWeight: "bold",
                    textAlign: "left",
                    fontFamily: "Outfit",
                    color: "#a328f4",
                  }}
                >
                  Bidi Verified
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    margin: "5px 0 0",
                    fontStyle: "italic",
                    textAlign: "left",
                    fontFamily: "Outfit",
                    color: "#a328f4",
                  }}
                >
                  100% Money-Back Guarantee When You Pay Through Bidi
                </p>
              </div>
            )
          )}
        </div>
        <div className="bid-display-btn-container">
          <button className="bid-display-button" disabled>
            ${bid.bid_amount}
            <div className="tag-hole"></div>
          </button>
        </div>
      </div>
      <hr />
      <div className="request-content">
        <p className="request-category" style={{ textAlign: "left" }}>
          <strong>Category:</strong> {bid.business_profiles.business_category}
        </p>
        <p className="request-description" style={{ textAlign: "left" }}>
          <strong>Description:</strong> {bid.bid_description}
        </p>
        {/* Display down payment information */}
        {downPayment && downPaymentAmount !== null && (
          <p className="request-comments" style={{ textAlign: "left" }}>
            <strong>Down Payment:</strong>{" "}
            {downPayment === "percentage"
              ? `$${(bid.bid_amount * downPaymentAmount).toFixed(2)} (${
                  downPaymentAmount * 100
                }%)`
              : `$${downPaymentAmount}`}
          </p>
        )}
        {/* Add coupon discount display */}
        {bid.coupon_applied && (
          <div
            style={{ marginTop: "8px", textAlign: "left", color: "#a328f4" }}
          >
            <strong>Coupon Applied:</strong> {bid.coupon_code}
            <br />
            <strong>Original Price:</strong> $
            {(bid.original_amount || 0).toFixed(2)}
            <br />
            <strong>Discount:</strong> ${(bid.discount_amount || 0).toFixed(2)}
            <br />
            <strong>Final Price:</strong> ${(bid.bid_amount || 0).toFixed(2)}
          </div>
        )}
      </div>

      {/* Adding space between the last line of content and the buttons */}
      <div style={{ marginBottom: "30px" }}></div>

      {/* Approve/Deny Buttons, separated from the main content */}
      <div className="business-actions">
        <button className="btn-danger" onClick={() => handleDeny(bid.id)}>
          Deny
        </button>
        <button
          className="btn-success"
          onClick={() => handleApprove(bid.id, bid.request_id)} // Pass both bidId and requestId
        >
          Accept
        </button>
      </div>
    </div>
  );
}

export default BidDisplay;

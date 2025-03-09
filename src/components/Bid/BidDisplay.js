import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // Import your Supabase client
import bidiCheck from "../../assets/images/Bidi-Favicon.png";

function BidDisplay({ bid, handleApprove, handleDeny }) {
  const [isBidiVerified, setIsBidiVerified] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [downPayment, setDownPayment] = useState(null); // New state for down payment
  const [downPaymentAmount, setDownPaymentAmount] = useState(null); // New state for down payment
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

  return (
    <div className="request-display">
      <div className="d-flex justify-content-between align-items-center">
        {/* Left Aligned: Business Name */}
        <div
          className="request-title"
          style={{ marginBottom: "0", textAlign: "left" }}
        >
          {bid.business_profiles.business_name}
          {isBidiVerified && (
            <img
              src={bidiCheck}
              style={{
                height: "40px",
                width: "auto",
                padding: "0px",
                marginLeft: "4px ",
              }}
              alt="Bidi Verified Icon"
            />
          )}
          {loading ? (
            <p>Loading...</p> // Show loading text while fetching
          ) : error ? (
            <p>{error}</p>
          ) : (
            isBidiVerified && (
              <div style={{ textAlign: "left", padding: "0px 0px" }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    margin: "0",
                    fontWeight: "bold",
                    textAlign: "left",
                    fontFamily: "Outfit",
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
                  }}
                >
                  100% Money-Back Guarantee When You Pay Through Bidi
                </p>
              </div>
            )
          )}
        </div>
        {/* Right Aligned: Price within a button */}
        <button className="bid-button" disabled>
          ${bid.bid_amount}
        </button>
      </div>
      <hr />
      <div className="request-content">
        <p className="request-category" style={{ textAlign: "left" }}>
          <strong>Category:</strong> {bid.business_profiles.business_category}
        </p>
        <p className="request-description" style={{ textAlign: "left" }}>
          <strong>Description:</strong> {bid.bid_description}
        </p>
        {/* If there's a website, display it */}
        {bid.business_profiles.website && (
          <p className="request-comments" style={{ textAlign: "left" }}>
            <strong>Website:</strong>{" "}
            <a
              href={bid.business_profiles.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              {bid.business_profiles.website}
            </a>
          </p>
        )}
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

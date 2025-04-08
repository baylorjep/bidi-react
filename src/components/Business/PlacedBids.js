import React, { useEffect, useState } from "react";
// import { supabase } from "../../supabaseClient";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import "../../styles/BusinessDashboard.css";

function PlacedBidDisplay({ requests }) {
  // Ensure requestId is properly destructured
  const [Bids, setBidInfo] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (requests && requests.length) {
      setBidInfo(requests); // Set the Bids state when requests data is available
    }
  }, [requests]); // Re-run this effect only when the 'requests' prop changes

  // Shorten description to a certain length
  const truncateText = (text, maxLength, linelength) => {
    if (!text) return "N/A";

    if (text.length <= maxLength) return text;

    // Find the last space within the linelength limit
    let spaceIndex = text.lastIndexOf(" ", linelength);

    // If there's no space within linelength, cut at linelength
    return spaceIndex === -1
      ? text.substring(0, linelength) + "..."
      : text.substring(0, maxLength) + "...";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid Date";
    }
  };

  if (!Bids) return <p>Loading...</p>; // Prevent rendering before data is loaded

  return (
    <>
      {Bids.map((BidInfo) => (
        <div className="job-card-not-bidded" key={BidInfo.id}>
          <span class="card-title">
            {truncateText(BidInfo.service_title, 20)}
          </span>

          {/* Job Info Grid (Two Columns, Two Rows) */}
          <div className="job-info-grid">
            {/* Row 1 - Price Range & Location */}
            <div className="job-info-item">
              <span className="job-label-name">Price Range</span>
              <span className="job-value-out">
                {truncateText(BidInfo.price_range, 20)}
              </span>
            </div>
            <div className="job-info-item">
              <span className="job-label-name">Location</span>
              <span className="job-value-out">
                {truncateText(BidInfo.location, 30, 6)}
              </span>
            </div>

            {/* Row 2 - Date & Time */}
            <div className="job-info-item">
              <span className="job-label-name">Date</span>
              <span className="job-value-out">
                {formatDate(BidInfo.service_date)}
              </span>
            </div>
            <div className="job-info-item">
              <span className="job-label-name">Time</span>
              <span className="job-value-out">
                {truncateText(BidInfo.time_of_day, 15)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="job-description">
            <span className="job-label-name">Description</span>
            <p className="job-value-out">
              {truncateText(BidInfo.additional_comments, 50, 15)}
            </p>
          </div>

          {/* View More Button */}
          <button
            className="view-btn-card"
            onClick={() => navigate(`/submit-bid/${BidInfo.id}`)} // Navigate to the submit-bid page with the request ID
          >
            View More
          </button>
        </div>
      ))}
    </>
  );
}

export default PlacedBidDisplay;

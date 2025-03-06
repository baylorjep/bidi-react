import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import bidiCheck from "../../assets/images/Bidi-Favicon.png";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function PlacedBidDisplay({ requestId }) {
  // Ensure requestId is properly destructured
  const [BidInfo, setBidInfo] = useState(null);

  useEffect(() => {
    const getBid = async () => {
      if (!requestId) return; // Prevents the request if requestId is missing
      console.log(requestId);
      const { data: placedBid, error: bidError } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (bidError) {
        console.error("Error fetching bid:", bidError);
        return;
      }

      setBidInfo(placedBid);
    };

    getBid();
  }, [requestId]); // Add requestId as a dependency

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

  if (!BidInfo) return <p>Loading...</p>; // Prevent rendering before data is loaded

  return (
    <div className="job-card">
      <h3 className="truncate">{truncateText(BidInfo.service_title, 20)}</h3>

      {/* Job Info Grid (Two Columns, Two Rows) */}
      <div className="job-info-grid">
        {/* Row 1 - Price Range & Location */}
        <div className="job-info-item">
          <span className="job-label">Price Range</span>
          <span className="job-value">
            {truncateText(BidInfo.price_range, 20)}
          </span>
        </div>
        <div className="job-info-item">
          <span className="job-label">Location</span>
          <span className="job-value">
            {truncateText(BidInfo.location, 30, 6)}
          </span>
        </div>

        {/* Row 2 - Date & Time */}
        <div className="job-info-item">
          <span className="job-label">Date</span>
          <span className="job-value">{formatDate(BidInfo.service_date)}</span>
        </div>
        <div className="job-info-item">
          <span className="job-label">Time</span>
          <span className="job-value">
            {truncateText(BidInfo.time_of_day, 15)}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="job-description">
        <span className="job-label">Description</span>
        <p className="job-value">
          {truncateText(BidInfo.additional_comments, 50, 15)}
        </p>
      </div>

      <Link to={`/submit-bid/${BidInfo.id}`} style={{ textDecoration: "none" }}>
        <button className="view-btn">View</button>
      </Link>
    </div>
  );
}

export default PlacedBidDisplay;

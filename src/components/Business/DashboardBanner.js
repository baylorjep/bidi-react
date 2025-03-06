import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../App.css"; // Include this for custom styles
import { useNavigate } from "react-router-dom";
import thumbsUpIcon from "../../assets/images/Icons/thumbs-up.svg";
import thumbsDownIcon from "../../assets/images/Icons/thumbs-down.svg";
import clockIcon from "../../assets/images/Icons/clock.svg";

const DashboardBanner = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [deniedCount, setDeniedCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessDetailsRequestsAndBids = async () => {
      console.log("Fetching Business Details, Requests, and Bids...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      if (!user) {
        console.error("No user found.");
        return;
      }

      if (user) {
        // Fetch bids and count Pending, Approved, Denied
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("bid_amount, id, status, bid_description, request_id, hidden") // Get the request_id for each bid
          .eq("user_id", user.id) // Only fetch bids for the current business
          .or("hidden.is.false,hidden.is.null"); // This will check for both false and null

        if (bidsError) {
          console.error("Error fetching bids:", bidsError);
          return;
        }

        // Count bid statuses dynamically
        const counts = { pending: 0, approved: 0, denied: 0 };
        bidsData.forEach((bid) => {
          if (bid.status === "pending") counts.pending += 1;
          else if (bid.status === "accepted") counts.approved += 1;
          else if (bid.status === "denied") counts.denied += 1;
        });

        setPendingCount(counts.pending);
        setApprovedCount(counts.approved);
        setDeniedCount(counts.denied);
      }
    };

    fetchBusinessDetailsRequestsAndBids();
  }, []);

  return (
    <>
      <br></br>
      <section className="dashboard-header">
        {/* Left Section */}
        <div className="dashboard-header-left">
          <span className="dashboard-title">My Dashboard</span>
          <span className="dashboard-subtext">
            Welcome! Manage your bids and track your business performance all in
            one place
          </span>
          <button
            className="see-all-btn"
            onClick={() => navigate("/Open-Requests")}
          >
            See All ↗
          </button>
        </div>

        {/* Right Section (Stats) */}
        <div className="dashboard-stats">
          <div className="stat">
            <span>
              <img src={clockIcon} alt="Pending" className="status-icon" />
              <span className="stat-number">{pendingCount}</span>
            </span>
            <span className="stat-subtext">Pending</span>
          </div>
          <div className="stat">
            <span>
              <img src={thumbsUpIcon} alt="Approved" className="status-icon" />
              <span className="stat-number">{approvedCount}</span>
            </span>
            <span className="stat-subtext">Approved</span>
          </div>
          <div className="stat">
            <span>
              <img src={thumbsDownIcon} alt="Denied" className="status-icon" />
              <span className="stat-number">{deniedCount}</span>
            </span>
            <span className="stat-subtext">Denied</span>
          </div>
        </div>
      </section>
    </>
  );
};

export default DashboardBanner;

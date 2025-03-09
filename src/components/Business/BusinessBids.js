import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { format } from "date-fns";
import "../../styles/BusinessBids.css";

const BusinessBids = () => {
  const [bids, setBids] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchBusinessBids = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error(
            "❌ Error fetching user:",
            userError || "No user found."
          );
          return;
        }

        const { data: businessBids, error: bidError } = await supabase
          .from("bids")
          .select("id, request_id, category, status, bid_amount")
          .eq("user_id", user.id);

        if (bidError) {
          console.error("❌ Error fetching bids:", bidError);
          return;
        }

        if (!businessBids || businessBids.length === 0) {
          setBids([]);
          setRequests([]);
          return;
        }

        setBids(businessBids);

        const requestMap = {};
        businessBids.forEach((bid) => {
          const categoryTable = `${bid.category.toLowerCase()}_requests`;
          if (!requestMap[categoryTable]) requestMap[categoryTable] = [];
          requestMap[categoryTable].push(bid.request_id);
        });

        let allRequests = [];
        for (const [table, ids] of Object.entries(requestMap)) {
          const { data: requestData, error: requestError } = await supabase
            .from(table)
            .select("*")
            .in("id", ids);

          if (requestError) {
            console.error(`❌ Error fetching from ${table}:`, requestError);
            continue;
          }

          allRequests = [...allRequests, ...requestData];
        }

        setRequests(allRequests);
      } catch (error) {
        console.error(
          "❌ An error occurred while fetching business bids:",
          error
        );
      }
    };

    fetchBusinessBids();
  }, []);

  // Group bids by status
  const pendingBids = bids.filter((bid) => bid.status === "pending");
  const approvedBids = bids.filter((bid) => bid.status === "approved");
  const deniedBids = bids.filter((bid) => bid.status === "denied");

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Function to render the job cards inside status sections
  const renderStatusSection = (status, title, colorClass, bidsList) => (
    <div className={`bids-status-column ${colorClass}`} key={status}>
      <div className="bids-status-header">
        <span>{title}</span>
        <span className={`status-number ${colorClass}`}>{bidsList.length}</span>
      </div>
      <div className={`status-underline ${colorClass}`}></div>
      {bidsList.length > 0 ? (
        <div className="bids-grid">
          {bidsList.map((bid) => {
            const request = requests.find((req) => req.id === bid.request_id);
            return (
              request && (
                <div key={bid.id} className="job-card">
                  <h3 className="truncate">
                    {request.event_title || "Untitled Request"}
                  </h3>
                  <div className="job-info-grid">
                    <div className="job-info-item">
                      <span className="job-label">Price Range</span>
                      <span className="job-value">
                        {request.price_range || "N/A"}
                      </span>
                    </div>
                    <div className="job-info-item">
                      <span className="job-label">Location</span>
                      <span className="job-value">
                        {request.location || "TBD"}
                      </span>
                    </div>
                    <div className="job-info-item">
                      <span className="job-label">Date</span>
                      <span className="job-value">
                        {formatDate(request.start_date)}
                      </span>
                    </div>
                    <div className="job-info-item">
                      <span className="job-label">Time</span>
                      <span className="job-value">
                        {request.start_time || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="job-description">
                    <span className="job-label">Description</span>
                    <p className="job-value">
                      {request.additional_comments ||
                        "No description available."}
                    </p>
                  </div>
                  <button className="view-btn">View</button>
                </div>
              )
            );
          })}
        </div>
      ) : (
        <p>No {title.toLowerCase()} bids.</p>
      )}
    </div>
  );

  return (
    <div className="bids-status-container">
      {renderStatusSection("pending", "PENDING", "pending", pendingBids)}
      {renderStatusSection("approved", "APPROVED", "approved", approvedBids)}
      {renderStatusSection("denied", "DENIED", "denied", deniedBids)}
    </div>
  );
};

export default BusinessBids;

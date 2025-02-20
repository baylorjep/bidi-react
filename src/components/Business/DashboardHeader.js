import React from "react";
import thumbsUpIcon from "../../assets/images/Icons/thumbs-up.svg";
import thumbsDownIcon from "../../assets/images/Icons/thumbs-down.svg";
import clockIcon from "../../assets/images/Icons/clock.svg";

const DashboardHeader = ({ pendingCount, approvedCount, deniedCount, navigate }) => {
  return (
    <section className="dashboard-header">
      <div className="dashboard-header-left">
        <span className="dashboard-title">My Dashboard</span>
        <span className="dashboard-subtext">
          Welcome! Manage your bids and track your business performance all in one place.
        </span>
        <button className="see-all-btn" onClick={() => navigate("/Open-Requests")}>
          See All ↗
        </button>
      </div>

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
  );
};

export default DashboardHeader;
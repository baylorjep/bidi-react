import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BidDisplayMini.css";

const BidDisplayMini = ({ bid, request, onEditBid, openWithdrawModal }) => {
  const navigate = useNavigate();

  const getTitle = () => request?.event_title || "Untitled Request";

  return (
    <div className="request-display-mini text-center mb-4">
      <div className="request-content p-3">
        <div
          style={{
            textAlign: "left",
            width: "100%",
            padding: "0 10px",
            marginBottom: "20px",
          }}
        >
          <h2 className="request-title">{getTitle()}</h2>
          {bid.expirationStatus && (
            <div className={`expiration-badge ${bid.expirationStatus.status}`}>
              {bid.expirationStatus.text}
            </div>
          )}
        </div>

        <div className="details-grid">
          {request?.event_type && (
            <div className="detail-item">
              <span className="detail-label">Event Type</span>
              <span className="detail-value">{request.event_type}</span>
            </div>
          )}
          {request?.date_preference && (
            <div className="detail-item">
              <span className="detail-label">Date Preference</span>
              <span className="detail-value">{request.date_preference}</span>
            </div>
          )}
          {request?.location && (
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">{request.location}</span>
            </div>
          )}
          {request?.number_of_people && (
            <div className="detail-item">
              <span className="detail-label">Number of People</span>
              <span className="detail-value">{request.number_of_people}</span>
            </div>
          )}
          {request?.duration && (
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{request.duration}</span>
            </div>
          )}
        </div>

        {/* Bid Info */}
        <div className="bid-info-box">
          Your Bid:
          {bid?.bid_amount && (
            <div className="detail-item">
              <span className="detail-label">Amount: ${bid.bid_amount}</span>
            </div>
          )}
          {bid?.description && (
            <div className="detail-item">
              <span className="detail-label">
                Description: {bid.description}
              </span>
            </div>
          )}
          {bid?.status && (
            <div className="detail-item">
              <span className="detail-label">Status: {bid.status}</span>
            </div>
          )}
          {!bid?.viewed && (
            <div className="detail-item">
              <span className="detail-label">Not viewed yet</span>
            </div>
          )}
          {/* Buttons */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <button
              className="view-btn-card"
              onClick={() => openWithdrawModal(bid.id)}
            >
              Withdraw
            </button>
            <button
              className="view-btn-card"
              onClick={() => onEditBid(bid.request_id, bid.id)}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidDisplayMini;

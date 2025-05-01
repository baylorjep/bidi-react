import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BidDisplayMini.css";
import { FaEnvelope, FaSms } from "react-icons/fa";

const BidDisplayMini = ({ bid, request, onEditBid, openWithdrawModal }) => {
  const navigate = useNavigate();

  const getTitle = () => {
    if (request?.title) return request.title;
    return request?.service_title || request?.event_title || "Untitled Request";
  };

  return (
    <div className="request-display-mini text-center mb-4">
      <div className="request-content p-3">
        <div className="request-header">
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

        <div className="bid-info-box">
          <h3 className="bid-info-title">Your Bid</h3>
          {bid?.bid_amount && (
            <div className="detail-item">
              <span className="detail-label">Amount</span>
              <span className="detail-value">${bid.bid_amount}</span>
            </div>
          )}
          {bid?.description && (
            <div className="detail-item">
              <span className="detail-label">Description</span>
              <span className="detail-value">{bid.description}</span>
            </div>
          )}
          {bid?.status && (
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">{bid.status}</span>
            </div>
          )}
          {!bid?.viewed && (
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">Not viewed yet</span>
            </div>
          )}

          {/* Show contact information for accepted bids */}
          {(bid.status === "accepted" || bid.status === "approved") && (
            <div className="contact-info-section">
              <h3 className="contact-info-title">Client Contact Information</h3>
              {request?.user_first_name && request?.user_last_name && (
                <div className="detail-item">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{`${request.user_first_name} ${request.user_last_name}`}</span>
                </div>
              )}
              {request?.user_email && (
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{request.user_email}</span>
                  <button 
                    className="contact-btn email-btn"
                    onClick={() => window.location.href = `mailto:${request.user_email}`}
                  >
                    <FaEnvelope /> Email
                  </button>
                </div>
              )}
              {request?.user_phone && (
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{request.user_phone}</span>
                  <button 
                    className="contact-btn text-btn"
                    onClick={() => window.location.href = `sms:${request.user_phone}`}
                  >
                    <FaSms /> Text
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="withdraw-btn"
              onClick={() => openWithdrawModal(bid.id)}
            >
              Withdraw
            </button>
            <button
              className="withdraw-btn"
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

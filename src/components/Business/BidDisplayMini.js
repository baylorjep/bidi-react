import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BidDisplayMini.css";
import { FaEnvelope, FaSms } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import ContractSignatureModal from "../Bid/ContractSignatureModal";

const BidDisplayMini = ({ bid, request, onEditBid, openWithdrawModal, onContractUpload }) => {
  const navigate = useNavigate();
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");
  const [signed, setSigned] = useState(!!bid.business_signature);
  const [showContractModal, setShowContractModal] = useState(false);
  const [clientSignature, setClientSignature] = useState("");
  const [clientSigning, setClientSigning] = useState(false);
  const [clientSignError, setClientSignError] = useState("");
  const [clientSigned, setClientSigned] = useState(!!bid.client_signature);
  const [signaturePos, setSignaturePos] = useState(null);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const pdfWrapperRef = React.useRef(null);

  const getTitle = () => {
    if (request?.title) return request.title;
    return request?.service_title || request?.event_title || "Untitled Request";
  };

  const canUploadContract = ["pending", "approved", "accepted"].includes(bid.status);

  const handleContractChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (onContractUpload) {
      onContractUpload(bid, file);
    }
  };

  const handleSignContract = async () => {
    setSignError("");
    if (!signature.trim()) {
      setSignError("Signature is required.");
      return;
    }
    setSigning(true);
    const { error } = await supabase
      .from("bids")
      .update({ business_signature: signature, business_signed_at: new Date().toISOString() })
      .eq("id", bid.id);
    setSigning(false);
    if (error) {
      setSignError("Failed to sign contract. Please try again.");
    } else {
      setSigned(true);
    }
  };

  const handlePdfClick = (e) => {
    if (!placingSignature || !pdfWrapperRef.current) return;
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSignaturePos({ x, y });
    setPlacingSignature(false);
  };

  const handleClientSignContract = async () => {
    setClientSignError("");
    if (!clientSignature.trim()) {
      setClientSignError("Signature is required.");
      return;
    }
    setClientSigning(true);
    const { error } = await supabase
      .from("bids")
      .update({ client_signature: clientSignature, client_signed_at: new Date().toISOString() })
      .eq("id", bid.id);
    setClientSigning(false);
    if (error) {
      setClientSignError("Failed to sign contract. Please try again.");
    } else {
      setClientSigned(true);
    }
  };

  const handleDownloadSignedPdf = () => {
    // You can implement PDF download logic here or pass it as a prop
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

          {/* Contract upload section */}
          {canUploadContract && (
            <div className="contract-upload-section" style={{ margin: '10px 0' }}>
              <label style={{ fontWeight: 600 }}>Contract File:</label>
              {bid.contract_url ? (
                <div>
                  <a href={bid.contract_url} target="_blank" rel="noopener noreferrer">View Uploaded Contract</a>
                  {/* Business signature UI */}
                  {signed ? (
                    <div style={{ marginTop: 8, color: 'green' }}>
                      Signed by business: <b>{bid.business_signature || signature}</b>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Type your name to sign"
                        value={signature}
                        onChange={e => setSignature(e.target.value)}
                        disabled={signing}
                        style={{ marginRight: 8 }}
                      />
                      <button onClick={handleSignContract} disabled={signing} style={{ padding: '4px 12px' }}>
                        {signing ? "Signing..." : "Sign Contract"}
                      </button>
                      {signError && <div style={{ color: 'red', marginTop: 4 }}>{signError}</div>}
                    </div>
                  )}
                </div>
              ) : (
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleContractChange} />
              )}
            </div>
          )}

          {bid.contract_url && (
            <button
              className="contract-sign-btn"
              style={{ margin: '16px 0', width: '100%' }}
              onClick={() => setShowContractModal(true)}
            >
              Sign / View Contract
            </button>
          )}

          <ContractSignatureModal
            isOpen={showContractModal}
            onClose={() => setShowContractModal(false)}
            bid={bid}
            pdfPage={pdfPage}
            setPdfPage={setPdfPage}
            pdfWrapperRef={pdfWrapperRef}
            handlePdfClick={handlePdfClick}
            signaturePos={signaturePos}
            setSignaturePos={setSignaturePos}
            placingSignature={placingSignature}
            setPlacingSignature={setPlacingSignature}
            clientSignature={clientSignature}
            setClientSignature={setClientSignature}
            clientSigning={clientSigning}
            clientSignError={clientSignError}
            clientSigned={clientSigned}
            handleClientSignContract={handleClientSignContract}
            handleDownloadSignedPdf={handleDownloadSignedPdf}
          />

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

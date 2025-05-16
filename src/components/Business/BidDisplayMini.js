import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BidDisplayMini.css";
import { FaEnvelope, FaSms } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import ContractSignatureModal from "../Bid/ContractSignatureModal";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';

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

  const handleDownloadSignedPdf = async () => {
    if (!bid.contract_url || !bid.business_signed_at || !bid.client_signed_at) return;
    
    try {
      // Fetch the PDF data
      const response = await fetch(bid.contract_url);
      const pdfData = await response.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
      const page = pages[0]; // Use first page by default
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
          // Format timestamps
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    };

    // Place business signature (bottom left)
    if (bid.business_signature_image_url) {
      // If we have a signature image URL, fetch and embed it
      const response = await fetch(bid.business_signature_image_url);
      const imageBytes = await response.arrayBuffer();
      const image = await pdfDoc.embedPng(imageBytes);
      const { width, height } = image.scale(0.5); // Scale down the image if needed
      
      page.drawImage(image, {
        x: 50,
        y: 70, // Moved up to make room for timestamp
        width,
        height
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (bid.business_signature) {
      // Fallback to text signature
      page.drawText(`Business: ${bid.business_signature}`, {
        x: 50,
        y: 70, // Moved up to make room for timestamp
        size: 16,
        font,
        color: rgb(0, 0.4, 0),
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    
    // Place client signature (bottom right)
    const pageWidth = page.getWidth();
    if (bid.client_signature_image) {
      // If we have a signature image data URL
      const imageBytes = await fetch(bid.client_signature_image).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);
      const { width, height } = image.scale(0.5); // Scale down the image if needed
      
      page.drawImage(image, {
        x: pageWidth - width - 50,
        y: 70, // Moved up to make room for timestamp
        width,
        height
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
        x: pageWidth - 250,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (bid.client_signature) {
      // Fallback to text signature
      page.drawText(`Client: ${bid.client_signature}`, {
        x: pageWidth - 250,
        y: 70, // Moved up to make room for timestamp
        size: 16,
        font,
        color: rgb(0, 0, 0.6),
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
        x: pageWidth - 250,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
      
      // Save and download the PDF
      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'signed_contract.pdf');
    } catch (error) {
      console.error('Error downloading signed PDF:', error);
      toast.error('Failed to download signed contract');
    }
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
          <div className="bid-info-grid">
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
          </div>
        </div>

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
            <>
              {/* Show sign button if business hasn't signed yet */}
              {!bid.business_signed_at && (
                <button
                  className="contract-sign-btn"
                  style={{ 
                    margin: '16px 0', 
                    width: '100%',
                    background: '#9633eb',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '15px',
                    boxShadow: '0 2px 4px rgba(150,51,235,0.1)'
                  }}
                  onClick={() => setShowContractModal(true)}
                >
                  <i className="fas fa-signature"></i>
                  Sign Contract as Business
                </button>
              )}

              {/* Show waiting message if business has signed and waiting for client */}
              {bid.business_signed_at && !bid.client_signed_at && (
                <div
                  style={{ 
                    margin: '16px 0', 
                    padding: '12px',
                    background: '#f0f0f0',
                    color: '#666',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Waiting for client signature...
                </div>
              )}

              {/* Show single view button when both have signed */}
              {bid.business_signed_at && bid.client_signed_at && (
                <button
                  className="contract-sign-btn"
                  style={{ 
                    margin: '16px 0', 
                    width: '100%',
                    background: '#9633eb',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '15px',
                    boxShadow: '0 2px 4px rgba(150,51,235,0.1)'
                  }}
                  onClick={() => setShowContractModal(true)}
                >
                  <i className="fas fa-file-contract"></i>
                  View Contract
                </button>
              )}
            </>
          )}

          <ContractSignatureModal
            isOpen={showContractModal}
            onClose={() => {
              console.log('BidDisplayMini modal closing');
              setShowContractModal(false);
            }}
            bid={bid}
            userRole={'business'}
            testSource="BidDisplayMini"
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
              View/Edit
            </button>
          </div>

      </div>
    </div>
  );
};

export default BidDisplayMini;

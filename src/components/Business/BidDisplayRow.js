import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaSms, FaEye, FaCommentAlt, FaEdit, FaTrash, FaComments } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import ContractSignatureModal from "../Bid/ContractSignatureModal";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { useState as useReactState } from 'react';
import { FaInfoCircle } from "react-icons/fa";
import html2pdf from 'html2pdf.js';
import { createPortal } from "react-dom";
import { Spinner } from "react-bootstrap";

const BidDisplayRow = ({ 
  bid, 
  request, 
  bidDate, 
  onEditBid, 
  openWithdrawModal, 
  onContractUpload,
  onContractView,
  onFollowUp,
  onMessageClick,
  onViewRequest
}) => {
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
  const [selectedFileName, setSelectedFileName] = useReactState("");
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [contractTemplate, setContractTemplate] = useState(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateVariables, setTemplateVariables] = useState({
    clientName: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    servicesDescription: '',
    priceBreakdown: '',
    totalAmount: '',
    downPaymentAmount: '',
    signatureDate: ''
  });
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFollowUpButton, setShowFollowUpButton] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [businessJustSigned, setBusinessJustSigned] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showInfoTooltip) return;
    const handleClick = () => setShowInfoTooltip(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showInfoTooltip]);

  useEffect(() => {
    const fetchContractTemplate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("business_profiles")
          .select("contract_template")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setContractTemplate(profile?.contract_template);
      } catch (error) {
        console.error("Error fetching contract template:", error);
        toast.error("Failed to load contract template");
      }
    };

    fetchContractTemplate();
  }, []);

  useEffect(() => {
    if (bid.created_at && bid.status === 'pending' && !bid.followed_up) {
      const bidDate = new Date(bid.created_at);
      const followUpDate = new Date(bidDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days after bid
      const now = new Date();
      setShowFollowUpButton(now >= followUpDate);
    }
  }, [bid.created_at, bid.status, bid.followed_up]);

  const getTitle = () => {
    if (request?.title) return request.title;
    return request?.service_title || request?.event_title || "Untitled Request";
  };

  const canUploadContract = ["pending", "approved", "accepted", "interested"].includes(bid.status);

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return { status: 'normal', text: 'No expiration' };
    
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired' };
    if (diffDays <= 1) return { status: 'urgent', text: 'Expires today' };
    if (diffDays <= 3) return { status: 'warning', text: `Expires in ${diffDays} days` };
    return { status: 'normal', text: `Expires in ${diffDays} days` };
  };

  const expirationStatus = getExpirationStatus(bid.expiration_date);

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusDisplay = () => {
    if (bid.status === 'paid') {
      if (bid.payment_type === 'down_payment') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Down Payment Paid</span>
            <span style={{ color: '#666', fontSize: '0.9em' }}>
              ${bid.payment_amount?.toFixed(2)} paid
              <br />
              ${(bid.bid_amount - bid.payment_amount)?.toFixed(2)} remaining
            </span>
          </div>
        );
      } else {
        return (
          <span style={{ color: '#10b981', fontWeight: 700 }}>
            Fully Paid (${bid.payment_amount?.toFixed(2)})
          </span>
        );
      }
    } else if (bid.status === 'pending') {
      return bid.viewed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <FaEye style={{ color: '#9633eb' }} />
          <span style={{ color: '#9633eb', fontWeight: 600 }}>Viewed</span>
        </div>
      ) : (
        <span style={{ color: '#666' }}>Pending</span>
      );
    } else if (bid.status === 'interested') {
      return (
        <span style={{ 
          color: '#ff4d8d', 
          fontWeight: 700,
          animation: 'pulse 2s infinite'
        }}>
          Interested
        </span>
      );
    } else if (bid.status === 'approved' || bid.status === 'accepted') {
      return (
        <span style={{ color: '#28a745', fontWeight: 600 }}>
          {bid.status === 'accepted' ? 'Accepted' : 'Approved'}
        </span>
      );
    } else if (bid.status === 'denied') {
      return (
        <span style={{ color: '#dc3545', fontWeight: 600 }}>
          Denied
        </span>
      );
    }
    return bid.status;
  };

  const handleContractChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF or Word documents (.pdf, .doc, .docx) are allowed.");
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${bid.id}_contract.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(uploadError.message || 'Failed to upload contract. Please try again.');
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('No upload data returned');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      const { error: urlUpdateError } = await supabase
        .from('bids')
        .update({ 
          contract_url: publicUrl
        })
        .eq('id', bid.id);

      if (urlUpdateError) {
        console.error('URL update error:', urlUpdateError);
        throw new Error('Failed to update contract URL');
      }

      if (onContractUpload) {
        onContractUpload(bid, file);
      }

      toast.success('Contract uploaded successfully');
      setShowContractModal(true);
    } catch (error) {
      console.error('Error uploading contract:', error);
      toast.error(error.message || 'Failed to upload contract. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFollowUp = async () => {
    try {
      // Use the parent component's handler if provided, otherwise handle locally
      if (onFollowUp) {
        await onFollowUp(bid);
      } else {
        // Fallback to local handling
        const { error } = await supabase
          .from('bids')
          .update({ followed_up: true })
          .eq('id', bid.id);

        if (error) throw error;

        if (onMessageClick) {
          onMessageClick(
            request.profile_id || request.user_id,
            "Hi! I wanted to follow up about your request. Are you still looking for services?"
          );
        } else {
          console.error('onMessageClick prop is not provided');
          toast.error('Messaging functionality is not available');
        }
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast.error('Failed to send follow-up');
    }
  };

  const handleContractModalClose = (justSigned = false) => {
    setShowContractModal(false);
    if (justSigned) {
      setBusinessJustSigned(true);
    }
  };

  const PortalModal = ({ children }) => {
    if (typeof window === "undefined") return null;
    return createPortal(
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}>
        {children}
      </div>,
      document.body
    );
  };

  // Determine the event date from the request object
  const eventDate =
    request?.start_date ||
    request?.date_preference ||
    request?.event_date ||
    request?.created_at ||
    null;

  if (isMobile) {
    // Card/stacked layout for mobile
    return (
      <div className="bid-card-mobile" style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(80,60,120,0.08)',
        margin: '12px 0',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        border: '1px solid #ececf0',
      }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#23232a', marginBottom: 4 }}>{getTitle()}</div>
        <div style={{ fontSize: '0.98rem', color: '#6b6b7a', marginBottom: 2 }}>{request?.event_type && `${request.event_type} • `}{request?.location}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 120 }}><span style={{ fontWeight: 500 }}>Event Date:</span> {eventDate ? formatDate(eventDate) : 'TBD'}</div>
          <div style={{ flex: 1, minWidth: 120 }}><span style={{ fontWeight: 500 }}>Bid Date:</span> {bidDate ? formatDate(bidDate) : 'TBD'}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 120 }}><span style={{ fontWeight: 500 }}>Bid Amount:</span> ${bid.bid_amount || '0'}</div>
          <div style={{ flex: 1, minWidth: 120 }}><span style={{ fontWeight: 500 }}>Status:</span> {getStatusDisplay()}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => onEditBid(bid.request_id, bid.id)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', background: '#9633eb', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
          >            <FaEdit style={{ fontSize: '1rem' }} /></button>
          {(bid.status === "approved" || bid.status === "accepted" || bid.status === "interested" || bid.status === "paid") && onMessageClick && (
            <button
              onClick={() => onMessageClick(
                request.profile_id || request.user_id,
                bid.status === "interested" ? `I'm interested in your request for ${getTitle()}` : null
              )}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', background: bid.status === "interested" ? "#ff4d8d" : "#28a745", color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
            >            <FaComments style={{ fontSize: '1rem' }} /></button>
          )}
          <button
            onClick={() => openWithdrawModal(bid.id)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', background: '#dc3545', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
          >            <FaTrash style={{ fontSize: '1rem' }} /></button>
        </div>
        {/* Contract/Follow-up/Other actions can be added here as needed */}
      </div>
    );
  }

  return (
    <div 
      className={`bid-row ${bid.status === "interested" ? "interested-bid" : ""}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #ececf0',
        background: bid.status === "interested" ? "linear-gradient(to right, #fff, #faf5ff)" : "#fff",
        transition: "all 0.3s ease",
        position: 'relative',
        flexDirection: 'row'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Request Info */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            fontWeight: 600, 
            color: '#23232a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {getTitle()}
          </h3>
          {bid.status === "interested" && (
            <div style={{
              background: "#9633eb",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              animation: "pulse 2s infinite"
            }}>
              <FaCommentAlt style={{ fontSize: '0.7rem' }} />
              Interested!
            </div>
          )}
          {bid.is_ai_generated && (
            <div style={{
              background: "#10b981",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <i className="fas fa-robot" style={{ fontSize: '0.7rem' }}></i>
              AI Generated
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#6b6b7a' }}>
          {request?.event_type && `${request.event_type} • `}
          {request?.date_preference && `${formatDate(request.date_preference)} • `}
          {request?.location && `${request.location}`}
        </div>
      </div>

      {/* Event Date */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#23232a' }}>
          {eventDate ? formatDate(eventDate) : 'TBD'}
        </div>
      </div>

      {/* Bid Date */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#23232a' }}>
          {bidDate ? formatDate(bidDate) : 'TBD'}
        </div>
      </div>

      {/* Bid Amount */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#23232a' }}>
          ${bid.bid_amount || '0'}
        </div>
      </div>

      {/* Status */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        {getStatusDisplay()}
        {expirationStatus.status !== 'normal' && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: expirationStatus.status === 'urgent' ? '#dc3545' : '#ffc107',
            marginTop: '2px'
          }}>
            {expirationStatus.text}
          </div>
        )}
      </div>

      {/* Actions (all buttons and contract/follow-up logic go here) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button
            onClick={() => onEditBid(bid.request_id, bid.id)}
            style={{
              background: '#9633eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="View/Edit Bid"
          >
            <FaEdit style={{ fontSize: '0.8rem' }} />
          </button>

          {(bid.status === "approved" || bid.status === "accepted" || bid.status === "interested" || bid.status === "paid") && onMessageClick && (
            <button
              onClick={() => onMessageClick(
                request.profile_id || request.user_id,
                bid.status === "interested" ? `I'm interested in your request for ${getTitle()}` : null
              )}
              style={{
                background: bid.status === "interested" ? "#ff4d8d" : bid.status === "paid" ? "#10b981" : "#28a745",
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                animation: bid.status === "interested" ? "pulse 2s infinite" : undefined
              }}
              title="Message Client"
            >
              <FaComments style={{ fontSize: '0.8rem' }} />
            </button>
          )}

          <button
            onClick={() => openWithdrawModal(bid.id)}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Withdraw Bid"
          >
            <FaTrash style={{ fontSize: '0.8rem' }} />
          </button>
        </div>

        {/* Contract Upload/View/Sign */}
        {(bid.status === 'approved' || bid.status === 'accepted') && (
          <div style={{ display: 'flex', gap: '6px', marginTop: 4 }}>
            {!bid.contract_url && !bid.contract_content ? (
              <label style={{
                background: '#9633eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleContractChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload" style={{ fontSize: '0.7rem' }}></i>
                    Upload Contract
                  </>
                )}
              </label>
            ) : (
              <>
                <button
                  onClick={() => onContractView ? onContractView(bid) : window.open(bid.contract_url, '_blank')}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <i className="fas fa-file-pdf" style={{ fontSize: '0.7rem' }}></i>
                  View Contract
                </button>
                {!bid.business_signed_at && (
                  <button
                    onClick={() => setShowContractModal(true)}
                    style={{
                      background: '#ffc107',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="fas fa-signature" style={{ fontSize: '0.7rem' }}></i>
                    Sign
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Follow-up Button */}
        {showFollowUpButton && (
          <button
            onClick={handleFollowUp}
            style={{
              background: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: 4
            }}
          >
            <FaCommentAlt style={{ fontSize: '0.7rem' }} />
            Follow-up
          </button>
        )}
      </div>

      {/* ContractSignatureModal */}
      <ContractSignatureModal
        isOpen={showContractModal}
        onClose={handleContractModalClose}
        bid={{
          ...bid,
          contract_url: bid.contract_url || null,
          contract_content: bid.contract_content || null
        }}
        userRole={'business'}
        testSource="BidDisplayRow"
        useTemplate={false}
        onBusinessSigned={() => setBusinessJustSigned(true)}
      />
    </div>
  );
};

export default BidDisplayRow; 
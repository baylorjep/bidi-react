import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BidDisplayMini.css";
import { FaEnvelope, FaSms, FaEye, FaCommentAlt } from "react-icons/fa";
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

const BidDisplayMini = ({ 
  bid, 
  request, 
  onEditBid, 
  openWithdrawModal, 
  onContractUpload,
  onMessageClick  // Add this prop
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
  const [uploading, setUploading] = useState(false); // <-- add state
  const [businessJustSigned, setBusinessJustSigned] = useState(false);

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

  const handleContractChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Only allow PDF or Word docs
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
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Use a unique file path per user and bid, similar to EditProfileModal
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${bid.id}_contract.${fileExt}`;

      // Upload to the 'contracts' bucket
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

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      // Update the bid with the contract URL
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
      if (bid.client_signature_image_url) {
        const imageBytes = await fetch(bid.client_signature_image_url).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);
        const { width, height } = image.scale(0.5);
        page.drawImage(image, {
          x: pageWidth - width - 50,
          y: 70,
          width,
          height
        });
        page.drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
          x: pageWidth - 250,
          y: 50,
          size: 10,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      } else if (bid.client_signature) {
        page.drawText(`Client: ${bid.client_signature}`, {
          x: pageWidth - 250,
          y: 70,
          size: 16,
          font,
          color: rgb(0, 0, 0.6),
        });
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

  const handleTemplateSelect = async () => {
    if (!contractTemplate) {
      toast.error("No contract template found. Please create one in your settings.");
      return;
    }

    // Initialize variables with values from the bid and request
    setTemplateVariables({
      clientName: request?.user_first_name && request?.user_last_name 
        ? `${request.user_first_name} ${request.user_last_name}`
        : 'Client Name',
      eventDate: request?.date_preference || 'TBD',
      eventTime: request?.time_preference || 'TBD',
      eventLocation: request?.location || 'TBD',
      servicesDescription: bid?.description || 'Services as described',
      priceBreakdown: bid?.price_breakdown || `Total Amount: $${bid?.bid_amount || '0'}`,
      totalAmount: `$${bid?.bid_amount || '0'}`,
      downPaymentAmount: bid?.down_payment_amount ? `$${bid.down_payment_amount}` : 'N/A',
      signatureDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    setShowTemplatePreview(true);
  };

  const handleCreateContract = async () => {
    try {
      if (!contractTemplate) {
        throw new Error('No contract template found');
      }

      // Replace variables in the template with values from templateVariables
      let contractContent = contractTemplate;
      Object.entries(templateVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        contractContent = contractContent.replace(regex, value);
      });

      // First update the bid with the contract content
      const { error: updateError } = await supabase
        .from('bids')
        .update({ 
          contract_content: contractContent,
          contract_status: 'pending_signatures'
        })
        .eq('id', bid.id);

      if (updateError) throw updateError;

      // Convert the content to PDF
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contractContent;

      // Configure html2pdf options
      const opt = {
        margin: 1,
        filename: `contract_${bid.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait'
        }
      };

      // Generate PDF
      const pdfBlob = await html2pdf().set(opt).from(tempDiv).output('blob');

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Create a unique file path
      const filePath = `contracts/${bid.id}_contract.pdf`;

      // Upload the PDF to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload contract PDF');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      // Update the bid with the contract URL
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

      // Close the preview modal
      setShowTemplatePreview(false);
      
      // Show success message
      toast.success('Contract created successfully');
      
      // Refresh the page to show the new contract

    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(error.message || 'Failed to create contract. Please try again.');
    }
  };

  const handleRemoveContract = async () => {
    try {
      // Update the bid to remove contract-related fields
      const { error } = await supabase
        .from('bids')
        .update({ 
          contract_content: null,
          contract_url: null,
          contract_status: null,
          business_signature: null,
          business_signature_image: null,
          business_signature_pos: null,
          business_signed_at: null,
          client_signature: null,
          client_signature_image: null,
          client_signature_box_pos: null,
          client_signed_at: null
        })
        .eq('id', bid.id);

      if (error) throw error;

      // If there's a contract URL, delete the file from storage
      if (bid.contract_url) {
        const { error: storageError } = await supabase.storage
          .from('contracts')
          .remove([`${bid.id}_contract.pdf`]);

        if (storageError) {
          console.error('Error deleting contract file:', storageError);
        }
      }

      toast.success('Contract removed successfully');
    } catch (error) {
      console.error('Error removing contract:', error);
      toast.error('Failed to remove contract');
    }
  };

  const handleFollowUp = async () => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ followed_up: true })
        .eq('id', bid.id);

      if (error) throw error;

      // Use the onMessageClick prop instead of navigate
      if (onMessageClick) {
        onMessageClick(
          request.profile_id || request.user_id,
          "Hi! I wanted to follow up about your request. Are you still looking for services?"
        );
      } else {
        console.error('onMessageClick prop is not provided');
        toast.error('Messaging functionality is not available');
      }

    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast.error('Failed to send follow-up');
    }
  };

  // Pass a callback to ContractSignatureModal to detect when business signature is saved
  const handleContractModalClose = (justSigned = false) => {
    setShowContractModal(false);
    if (justSigned) {
      setBusinessJustSigned(true);
    }
  };

  // Helper for portal modals
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
        zIndex: 99999 // very high to ensure above all
      }}>
        {children}
      </div>,
      document.body
    );
  };

  return (
    <div className={`request-display-mini ${bid.status === "interested" ? "interested-bid" : ""}`} style={{
      border: bid.status === "interested" ? "2px solid #9633eb" : undefined,
      boxShadow: bid.status === "interested" ? "0 4px 12px rgba(150, 51, 235, 0.15)" : undefined,
      background: bid.status === "interested" ? "linear-gradient(to right, #fff, #faf5ff)" : undefined,
      transition: "all 0.3s ease"
    }}>
      <div className="request-content p-3">
        <div className="request-header">
          <h2 className="request-title">{getTitle()}</h2>
          <div className="header-actions">
            {bid.status === "interested" && (
              <div style={{
                background: "#9633eb",
                color: "white",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                animation: "pulse 2s infinite"
              }}>
                <FaCommentAlt />
                Client Interested!
              </div>
            )}
            {showFollowUpButton && (
              <button
                className="follow-up-btn"
                onClick={handleFollowUp}
              >
                <span>Send Follow-up Message</span>
              </button>
            )}
            {bid.expirationStatus && (
              <div className={`expiration-badge ${bid.expirationStatus.status}`}>
                {bid.expirationStatus.text}
              </div>
            )}
          </div>
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
            <div className="detail-item" style={{ position: 'relative' }}>
              <span className="detail-label">Status</span>
              <span className="detail-value">
                {bid.status === 'pending' ? (
                  bid.viewed ? (
                    <>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <span style={{ color: '#9633eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FaEye style={{ marginRight: 4 }} />
                          Viewed
                        </span>
                        <span
                          className="info-icon-purple"
                          title={`The client has seen your bid but has not yet approved or denied it. Viewed on ${new Date(bid.viewed_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}`}
                          onClick={e => {
                            e.stopPropagation();
                            setShowInfoTooltip(v => !v);
                          }}
                          tabIndex={0}
                          aria-label="Show info about viewed status"
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -20,
                            fontSize: '0.8rem'
                          }}
                        >
                          <FaInfoCircle />
                        </span>
                      </div>
                      {showInfoTooltip && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: '120%',
                            background: '#fff',
                            color: '#333',
                            border: '1px solid #9633eb',
                            borderRadius: 8,
                            padding: '10px 14px',
                            fontSize: 14,
                            boxShadow: '0 2px 8px rgba(150,51,235,0.10)',
                            zIndex: 10,
                            minWidth: 220,
                            maxWidth: 260,
                            textAlign: 'center',
                            fontWeight: 400,
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          The client has seen your bid but has not yet approved or denied it.
                          {bid.viewed_at && (
                            <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>
                              Viewed: {new Date(bid.viewed_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      Awaiting Client Review
                      <span
                        className="info-icon-purple"
                        title="The client can see your bid and has not yet responded."
                        onClick={e => {
                          e.stopPropagation();
                          setShowInfoTooltip(v => !v);
                        }}
                        tabIndex={0}
                        aria-label="Show info about pending status"
                      >
                        <FaInfoCircle />
                      </span>
                      {showInfoTooltip && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: '120%',
                            background: '#fff',
                            color: '#333',
                            border: '1px solid #9633eb',
                            borderRadius: 8,
                            padding: '10px 14px',
                            fontSize: 14,
                            boxShadow: '0 2px 8px rgba(150,51,235,0.10)',
                            zIndex: 10,
                            minWidth: 220,
                            maxWidth: 260,
                            textAlign: 'center',
                            fontWeight: 400,
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          The client can see your bid and has not yet responded.
                        </div>
                      )}
                    </>
                  )
                ) : (
                  bid.status === "interested" ? (
                    <span style={{
                      color: '#ff4d8d',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      letterSpacing: '0.5px',
                      background: 'linear-gradient(45deg, #ff4d8d, #ff6b6b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'pulse 2s infinite'
                    }}>
                      Interested
                    </span>
                  ) : (
                    bid.status
                  )
                )}
              </span>
            </div>
          )}
          </div>
        </div>

        {/* Contract section only for approved bids */}
        {bid.status === 'approved' || bid.status === 'accepted' ? (
          <>
            <div className="contract-upload-section" style={{ margin: '10px 0' }}>
              {!bid.contract_url && !bid.contract_content && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      className="template-btn"
                      onClick={handleTemplateSelect}
                      style={{
                        background: '#9633eb',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600',
                        fontSize: '15px',
                        boxShadow: '0 2px 4px rgba(150,51,235,0.1)'
                      }}
                    >
                      <i className="fas fa-file-alt"></i>
                      Use Template
                    </button>
                    <label className="file-upload-label" style={{
                      background: '#f8f9fa',
                      color: '#333',
                      border: '1px solid #ddd',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '15px'
                    }}>
                      <i className="fas fa-upload"></i>
                      Upload File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleContractChange}
                        className="file-upload-input"
                        style={{ display: 'none' }}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {/* Spinner and upload status */}
                  {uploading && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
                      <Spinner animation="border" size="sm" style={{ marginRight: 8 }} />
                      <span style={{ color: '#9633eb', fontWeight: 500 }}>Uploading file...</span>
                    </div>
                  )}
                  {selectedFileName && !uploading && (
                    <span className="file-upload-filename" style={{
                      display: 'block',
                      textAlign: 'center',
                      color: '#666',
                      marginTop: '8px'
                    }}>
                      Selected file: {selectedFileName}
                    </span>
                  )}
                </div>
              )}
              
              {/* Always show the sign button if a contract was just uploaded (showContractModal is true) */}
              {(showContractModal || (bid.contract_url && !bid.business_signed_at)) && (
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

              {/* Show pending client signature button after business signs */}
              {(businessJustSigned || (bid.business_signed_at && !bid.client_signed_at)) && (
                <div
                  style={{
                    margin: '16px 0',
                    padding: '12px',
                    background: '#fffbe6',
                    color: '#b8860b',
                    border: '1px solid #ffe58f',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '15px'
                  }}
                >
                  Waiting for client signature...
                </div>
              )}
              
              {/* ...existing code for waiting message, view contract, remove contract, etc... */}
            </div>

            {/* ContractSignatureModal always rendered when showContractModal is true */}
            <ContractSignatureModal
              isOpen={showContractModal}
              onClose={handleContractModalClose}
              bid={{
                ...bid,
                contract_url: bid.contract_url || null,
                contract_content: bid.contract_content || null
              }}
              userRole={'business'}
              testSource="BidDisplayMini"
              useTemplate={false}
              // Optionally, you can add a prop to trigger callback on business sign
              onBusinessSigned={() => setBusinessJustSigned(true)}
            />
            {bid.business_signed_at && bid.client_signed_at && bid.contract_url && (
  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
    <button
      className="view-contract-btn"
      style={{
        flex: 1,
        padding: '12px',
        background: '#9633eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600'
      }}
      onClick={() => window.open(bid.contract_url, '_blank')}
    >
      <i className="fas fa-file-pdf" style={{ marginRight: 8 }}></i>
      Preview Contract
    </button>
    <button
      className="remove-contract-btn"
      style={{
        flex: 1,
        padding: '12px',
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600'
      }}
      onClick={() => setShowDeleteConfirm(true)}
    >
      <i className="fas fa-trash" style={{ marginRight: 8 }}></i>
      Remove Contract
    </button>
  </div>
)}
          </>
        ) : null}

        {/* Restore action buttons here so they always show */}
        <div className="action-buttons" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          width: '100%'
        }}>
          <button 
            className="action-button secondary" 
            onClick={() => openWithdrawModal(bid.id)}
            style={{ width: '100%' }}
          >
            Withdraw
          </button>
          {(bid.status === "approved" || bid.status === "accepted" || bid.status === "interested") && onMessageClick && (
            <button
              className="action-button"
              onClick={() => onMessageClick(
                request.profile_id || request.user_id,
                bid.status === "interested" ? `I'm interested in your request for ${getTitle()}` : null
              )}
              style={{ 
                width: '100%',
                background: bid.status === "interested" ? "#9633eb" : undefined,
                color: bid.status === "interested" ? "white" : undefined,
                transform: bid.status === "interested" ? "scale(1.02)" : undefined,
                boxShadow: bid.status === "interested" ? "0 4px 12px rgba(150, 51, 235, 0.2)" : undefined,
                animation: bid.status === "interested" ? "pulse 2s infinite" : undefined
              }}
            >
              <FaCommentAlt style={{ 
                fontSize: '1.2rem', 
                marginRight: '8px',
                animation: bid.status === "interested" ? "bounce 1s infinite" : undefined
              }} />
              {bid.status === "interested" ? "Message Client Now!" : "Message"}
            </button>
          )}
          <button 
            className="action-button primary"
            onClick={() => onEditBid(bid.request_id, bid.id)}
            style={{ width: '100%' }}
          >
            View/Edit
          </button>
        </div>
      </div>

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <PortalModal>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Review Contract Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Client Name</label>
                <input
                  type="text"
                  value={templateVariables.clientName}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, clientName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Event Date</label>
                <input
                  type="text"
                  value={templateVariables.eventDate}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, eventDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Event Time</label>
                <input
                  type="text"
                  value={templateVariables.eventTime}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, eventTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Event Location</label>
                <input
                  type="text"
                  value={templateVariables.eventLocation}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, eventLocation: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Services Description</label>
                <textarea
                  value={templateVariables.servicesDescription}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, servicesDescription: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    minHeight: '100px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Price Breakdown</label>
                <textarea
                  value={templateVariables.priceBreakdown}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, priceBreakdown: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    minHeight: '100px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Total Amount</label>
                <input
                  type="text"
                  value={templateVariables.totalAmount}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, totalAmount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Down Payment Amount</label>
                <input
                  type="text"
                  value={templateVariables.downPaymentAmount}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, downPaymentAmount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setShowTemplatePreview(false)}
                style={{
                  background: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContract}
                disabled={templateLoading}
                style={{
                  background: '#9633eb',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {templateLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-alt"></i>
                    Create Contract
                  </>
                )}
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {showDeleteConfirm && (
        <PortalModal>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#333' }}>Remove Contract</h3>
            <p style={{ marginBottom: '24px', color: '#666' }}>
              Are you sure you want to remove this contract? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveContract}
                style={{
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Remove Contract
              </button>
            </div>
          </div>
        </PortalModal>
      )}
    </div>
  );
};

export default BidDisplayMini;

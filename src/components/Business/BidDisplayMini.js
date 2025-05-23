import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BidDisplayMini.css";
import { FaEnvelope, FaSms, FaEye } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import ContractSignatureModal from "../Bid/ContractSignatureModal";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { useState as useReactState } from 'react';
import { FaInfoCircle } from "react-icons/fa";
import html2pdf from 'html2pdf.js';

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

  const getTitle = () => {
    if (request?.title) return request.title;
    return request?.service_title || request?.event_title || "Untitled Request";
  };

  const canUploadContract = ["pending", "approved", "accepted", "interested"].includes(bid.status);

  const handleContractChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFileName(file.name);

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // First update the bid status
      const { error: statusError } = await supabase
        .from('bids')
        .update({ 
          contract_status: 'pending_signatures'
        })
        .eq('id', bid.id);

      if (statusError) throw statusError;

      // Create a unique file path
      const filePath = `${bid.id}_contract.pdf`;

      // Try to upload with a different approach
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If the error is about the bucket not existing, try to create it
        if (uploadError.message.includes('bucket') || uploadError.statusCode === '404') {
          // Try to create the bucket
          const { error: createBucketError } = await supabase.storage.createBucket('contracts', {
            public: true,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: 52428800 // 50MB
          });

          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            throw new Error('Failed to create storage bucket');
          }

          // Try upload again after creating bucket
          const { data: retryUploadData, error: retryUploadError } = await supabase.storage
            .from('contracts')
            .upload(filePath, file, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (retryUploadError) {
            console.error('Retry upload error:', retryUploadError);
            throw new Error('Failed to upload after creating bucket');
          }

          uploadData = retryUploadData;
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
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

      // Show success message
      toast.success('Contract uploaded successfully');
      
      // Refresh the page to show the new contract
      window.location.reload();
    } catch (error) {
      console.error('Error uploading contract:', error);
      toast.error(error.message || 'Failed to upload contract. Please try again.');
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
      window.location.reload();
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
      window.location.reload();
    } catch (error) {
      console.error('Error removing contract:', error);
      toast.error('Failed to remove contract');
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
            <div className="detail-item" style={{ position: 'relative' }}>
              <span className="detail-label">Status</span>
              <span className="detail-value">
                {bid.status === 'pending' ? (
                  bid.viewed ? (
                    <>
                      <span style={{ color: '#9633eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FaEye style={{ marginRight: 4 }} />
                        Viewed by Client
                      </span>
                      <span
                        className="info-icon-purple"
                        title="The client has seen your bid but has not yet approved or denied it."
                        onClick={e => {
                          e.stopPropagation();
                          setShowInfoTooltip(v => !v);
                        }}
                        tabIndex={0}
                        aria-label="Show info about viewed status"
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
                  bid.status
                )}
              </span>
            </div>
          )}
          {bid?.viewed && (
            <div className="detail-item">
              <span className="detail-label">Viewed on:</span>
              <span className="detail-value">
                {bid.viewed_at ? new Date(bid.viewed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
          )}
          </div>
        </div>

        {/* Show contact information for accepted bids */}
        {(bid.status === "accepted" || bid.status === "approved") && (
          <div className="contact-info-section compact-contact-info">
            <div className="contact-info-row">
              {request?.user_first_name && request?.user_last_name && (
                <span className="contact-info-item">
                  <b>{`${request.user_first_name} ${request.user_last_name}`}</b>
                </span>
              )}
              {request?.user_email && (
                <span className="contact-info-item">
                  <a href={`mailto:${request.user_email}`} title="Email" className="contact-icon-link">
                    <FaEnvelope />
                  </a>
                  <span>{request.user_email}</span>
                </span>
              )}
              {request?.user_phone && (
                <span className="contact-info-item">
                  <a href={`sms:${request.user_phone}`} title="Text" className="contact-icon-link">
                    <FaSms />
                  </a>
                  <span>{request.user_phone}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contract section only for approved bids */}
        {bid.status === 'approved' || bid.status === 'accepted' && (
          <>
            <div className="contract-upload-section" style={{ margin: '10px 0' }}>
              {!bid.contract_url && !bid.contract_content && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      className="template-btn"
                      onClick={() => setUseTemplate(true)}
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
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleContractChange}
                        className="file-upload-input"
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  
                  {useTemplate && (
                    <div style={{
                      background: '#f8f9fa',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      marginTop: '8px'
                    }}>
                      <h4 style={{ marginBottom: '12px', color: '#333' }}>Create Contract from Template</h4>
                      <p style={{ marginBottom: '16px', color: '#666' }}>
                        This will create a new contract using your template, automatically filling in the client's information.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setUseTemplate(false)}
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
                          onClick={handleTemplateSelect}
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
                  )}
                  
                  {selectedFileName && (
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
              
              {/* Show Sign button if contract content exists but not signed */}
              {bid.contract_content && !bid.business_signed_at && (
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
                  Sign Contract
                </button>
              )}
              
              {bid.contract_url && (
                <div style={{ marginTop: 8 }}>
                  <a 
                    href={bid.contract_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#9633eb',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-file-contract"></i>
                    View Uploaded Contract
                  </a>
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
              )}
            </div>

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
              bid={{
                ...bid,
                contract_url: bid.contract_url || null,
                contract_content: bid.contract_content || null
              }}
              userRole={'business'}
              testSource="BidDisplayMini"
              useTemplate={false}
            />
          </>
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
            View/Edit
          </button>
        </div>

        {(bid.contract_url || bid.contract_content) && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: '#fff',
                color: '#dc3545',
                border: '1px solid #dc3545',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-trash-alt"></i>
              Remove Contract
            </button>
          </div>
        )}

      </div>

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
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
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
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
        </div>
      )}
    </div>
  );
};

export default BidDisplayMini;

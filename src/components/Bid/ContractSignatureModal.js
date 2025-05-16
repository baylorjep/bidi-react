import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Document, Page } from "react-pdf";
import { pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import Draggable from 'react-draggable';
import { toast } from 'react-hot-toast';
import { supabase } from "../../supabaseClient";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.js`;

function ContractSignatureModal({
  isOpen,
  onClose,
  bid,
  userRole, // "business" or "individual"
  testSource
}) {
  console.log('ContractSignatureModal rendered with:', {
    isOpen,
    userRole,
    testSource,
    bidId: bid?.id,
    hasBusinessSignature: !!(bid?.business_signature || bid?.business_signature_image),
    hasClientSignature: !!bid?.client_signature
  });

  const [pdfError, setPdfError] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  // Business signature state
  const [businessSignature, setBusinessSignature] = useState("");
  const [businessDrawMode, setBusinessDrawMode] = useState(false);
  const [businessSignatureImage, setBusinessSignatureImage] = useState(null);
  const [businessSignaturePos, setBusinessSignaturePos] = useState(null);
  const [placingBusinessSignature, setPlacingBusinessSignature] = useState(false);
  const businessSigPadRef = useRef();
  // Client signature box state
  const [clientSignatureBoxPos, setClientSignatureBoxPos] = useState(null);
  const [placingClientBox, setPlacingClientBox] = useState(false);
  const [clientSignatureBoxSize] = useState({ width: 180, height: 60 });
  // Client signature state
  const [clientSignature, setClientSignature] = useState("");
  const [clientDrawMode, setClientDrawMode] = useState(false);
  const [clientSignatureImage, setClientSignatureImage] = useState(null);
  const clientSigPadRef = useRef();
  // PDF state
  const [numPages, setNumPages] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const pdfWrapperRef = useRef();
  const [businessSignatureSize, setBusinessSignatureSize] = useState({ width: 180, height: 60 });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const resizeStartPos = useRef(null);
  const initialSize = useRef(null);

  // Fetch PDF data for react-pdf
  useEffect(() => {
    if (bid.contract_url && bid.contract_url.endsWith('.pdf')) {
      fetch(bid.contract_url)
        .then(res => res.arrayBuffer())
        .then(setPdfData);
    }
  }, [bid.contract_url]);

  // Download PDF with both signatures
  const handleDownloadSignedPdf = async () => {
    if (!pdfData || !bid.business_signed_at || !bid.client_signed_at) return;
    try {
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
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

      // Get signature positions
      const businessPos = bid.business_signature_pos ? JSON.parse(bid.business_signature_pos) : null;
      const clientPos = bid.client_signature_box_pos ? JSON.parse(bid.client_signature_box_pos) : null;

      // Place business signature at its saved position
      if (bid.business_signature_image_url && businessPos) {
        // If we have a signature image URL, fetch and embed it
        const response = await fetch(bid.business_signature_image_url);
        const imageBytes = await response.arrayBuffer();
        const image = await pdfDoc.embedPng(imageBytes);
        const { width, height } = image.scale(0.5); // Scale down the image if needed
        
        // Calculate which page this Y position falls on
        const pageHeight = pages[0].getHeight();
        const pageIndex = Math.floor(businessPos.y / pageHeight);
        const yPosInPage = businessPos.y % pageHeight;
        
        if (pages[pageIndex]) {
          pages[pageIndex].drawImage(image, {
            x: businessPos.x - width / 2,
            y: yPosInPage - height / 2,
            width,
            height
          });

          // Add timestamp below signature
          pages[pageIndex].drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
            x: businessPos.x - width / 2,
            y: yPosInPage - height / 2 - 20,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      } else if (bid.business_signature && businessPos) {
        // Calculate which page this Y position falls on
        const pageHeight = pages[0].getHeight();
        const pageIndex = Math.floor(businessPos.y / pageHeight);
        const yPosInPage = businessPos.y % pageHeight;

        if (pages[pageIndex]) {
          // Fallback to text signature
          pages[pageIndex].drawText(bid.business_signature, {
            x: businessPos.x,
            y: yPosInPage,
            size: 16,
            font,
            color: rgb(0, 0.4, 0),
          });

          // Add timestamp below signature
          pages[pageIndex].drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
            x: businessPos.x,
            y: yPosInPage - 20,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      }
    
      // Place client signature at its saved position
      if (bid.client_signature_image && clientPos) {
        // If we have a signature image data URL
        const imageBytes = await fetch(bid.client_signature_image).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);
        const { width, height } = image.scale(0.5); // Scale down the image if needed
        
        // Calculate which page this Y position falls on
        const pageHeight = pages[0].getHeight();
        const pageIndex = Math.floor(clientPos.y / pageHeight);
        const yPosInPage = clientPos.y % pageHeight;

        if (pages[pageIndex]) {
          pages[pageIndex].drawImage(image, {
            x: clientPos.x - width / 2,
            y: yPosInPage - height / 2,
            width,
            height
          });

          // Add timestamp below signature
          pages[pageIndex].drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
            x: clientPos.x - width / 2,
            y: yPosInPage - height / 2 - 20,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      } else if (bid.client_signature && clientPos) {
        // Calculate which page this Y position falls on
        const pageHeight = pages[0].getHeight();
        const pageIndex = Math.floor(clientPos.y / pageHeight);
        const yPosInPage = clientPos.y % pageHeight;

        if (pages[pageIndex]) {
          // Fallback to text signature
          pages[pageIndex].drawText(bid.client_signature, {
            x: clientPos.x,
            y: yPosInPage,
            size: 16,
            font,
            color: rgb(0, 0, 0.6),
          });

          // Add timestamp below signature
          pages[pageIndex].drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
            x: clientPos.x,
            y: yPosInPage - 20,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      }
      
      // Save and download the PDF
      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'signed_contract.pdf');
    } catch (error) {
      console.error('Error downloading signed PDF:', error);
      toast.error('Failed to download signed contract');
    }
  };

  // Resize handlers
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize.current = { ...businessSignatureSize };
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResize = (e) => {
    if (!resizeStartPos.current || !initialSize.current) return;
    
    const deltaX = e.clientX - resizeStartPos.current.x;
    const deltaY = e.clientY - resizeStartPos.current.y;
    
    const aspectRatio = initialSize.current.width / initialSize.current.height;
    const newWidth = Math.max(50, initialSize.current.width + deltaX);
    const newHeight = newWidth / aspectRatio;
    
    setBusinessSignatureSize({
      width: newWidth,
      height: newHeight
    });
  };

  const handleResizeEnd = () => {
    resizeStartPos.current = null;
    initialSize.current = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, initializing state with userRole:', userRole);
      console.log('Initial clientSignatureBoxPos:', bid.client_signature_box_pos);
      
      setBusinessSignature("");
      setBusinessDrawMode(false);
      setBusinessSignatureImage(null);
      setBusinessSignaturePos(null);
      setPlacingBusinessSignature(false);
      setClientSignature("");
      setClientDrawMode(false);
      setClientSignatureImage(null);
      setClientSignatureBoxPos(bid.client_signature_box_pos ? JSON.parse(bid.client_signature_box_pos) : null);
      setPdfPage(1);
      setPdfError(null);
    }
  }, [isOpen, bid.client_signature_box_pos]);

  // Add debug log before client UI render condition
  const shouldShowClientUI = userRole === "individual" && !bid.client_signature && !bid.client_signature_image;
  console.log('Client UI render conditions:', {
    userRole,
    hasClientSignature: !!(bid.client_signature || bid.client_signature_image),
    shouldShowClientUI
  });

  // Business signature save
  const handleBusinessSaveSignature = async () => {
    try {
      let sig;
      if (businessDrawMode) {
        if (businessSigPadRef.current && !businessSigPadRef.current.isEmpty()) {
          sig = businessSigPadRef.current.toDataURL();
        }
      } else {
        if (businessSignature) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 400;
          canvas.height = 100;
          ctx.font = '32px cursive';
          ctx.fillStyle = 'black';
          ctx.fillText(businessSignature, 10, 50);
          sig = canvas.toDataURL();
        }
      }

      if (sig) {
        setBusinessSignatureImage(sig);
        setPlacingBusinessSignature(true);
      }
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  // Save business signature position and start client box placement
  const handleSaveBusinessSignature = () => {
    console.log('handleSaveBusinessSignature called');
    try {
      // First set placing client box to true and turn off adjustment mode
      setPlacingClientBox(true);
      setIsAdjusting(false);
      
      // Save to database in the background
      const saveToDb = async () => {
        const { error } = await supabase
          .from('bids')
          .update({
            business_signature: businessSignature,
            business_signature_image: businessSignatureImage,
            business_signature_pos: JSON.stringify(businessSignaturePos)
          })
          .eq('id', bid.id);

        if (error) {
          console.error('Error saving business signature:', error);
          toast.error('Failed to save business signature');
          return;
        }
      };

      saveToDb();
      toast.success('Click where you want the client to sign');
    } catch (error) {
      console.error('Error in handleSaveBusinessSignature:', error);
      toast.error('Failed to proceed to client signature box placement');
      setPlacingClientBox(false);
    }
  };

  const handleSaveClientBox = async () => {
    console.log('handleSaveClientBox called');
    try {
      // Convert the data URL to a Blob
      const response = await fetch(businessSignatureImage);
      const blob = await response.blob();
  
      // Upload the business signature image to the 'contracts/signatures' folder
      const { data, error: uploadError } = await supabase.storage
        .from('contracts') // Ensure you have a bucket named 'contracts'
        .upload(`signatures/${bid.id}.png`, blob, {
          contentType: 'image/png'
        });
  
      if (uploadError) {
        console.error('Error uploading signature image:', uploadError);
        toast.error('Failed to upload signature image');
        return;
      }
  
      console.log('Upload successful:', data);
  
      // Manually construct the public URL
      const baseUrl = 'https://splafvfbznewlbeqaocv.supabase.co/storage/v1/object/public/';
      const filePath = `contracts/signatures/${bid.id}.png`;
      const publicURL = `${baseUrl}${filePath}`;
  
      console.log('Constructed Public URL:', publicURL);
  
      // Update the database with the client signature box position and business signature URL
      const { error } = await supabase
        .from('bids')
        .update({
          client_signature_box_pos: JSON.stringify(clientSignatureBoxPos),
          business_signature: businessSignature,
          business_signature_image_url: publicURL, // Store the constructed URL
          business_signed_at: new Date().toISOString()
        })
        .eq('id', bid.id);
  
      if (error) {
        console.error('Error saving client signature box position:', error);
        toast.error('Failed to save client signature box position');
        return;
      }
      
      toast.success('Client signature box placement saved.');
      onClose();
    } catch (error) {
      console.error('Error saving client signature box position:', error);
      toast.error('Failed to save client signature box position');
    }
  };

  // Client signature save
  const handleClientSaveSignature = async () => {
    try {
      let sig;
      if (clientDrawMode) {
        if (clientSigPadRef.current && !clientSigPadRef.current.isEmpty()) {
          sig = clientSigPadRef.current.toDataURL();
        }
      } else {
        if (clientSignature) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 400;
          canvas.height = 100;
          ctx.font = '32px cursive';
          ctx.fillStyle = '#9633eb';
          ctx.fillText(clientSignature, 10, 50);
          sig = canvas.toDataURL();
        }
      }

      if (sig) {
        // Save client signature to database with image
        const { error } = await supabase
          .from('bids')
          .update({
            client_signature: clientSignature,
            client_signature_image: sig,
            client_signed_at: new Date().toISOString()
          })
          .eq('id', bid.id);

        if (error) throw error;

        setClientSignatureImage(sig);
        toast.success('Contract signed successfully');
        onClose();
      } else {
        toast.error('Please provide a signature');
      }
    } catch (error) {
      console.error('Error saving client signature:', error);
      toast.error('Failed to save signature');
    }
  };

  // Unified PDF click handler
  const handlePdfAreaClick = (e) => {
    try {
      if (!pdfWrapperRef.current) return;
      
      const rect = pdfWrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (placingBusinessSignature) {
        setBusinessSignaturePos({ x, y });
        setPlacingBusinessSignature(false);
      } else if (placingClientBox) {
        setClientSignatureBoxPos({ x, y });
        setPlacingClientBox(false);
      }
    } catch (error) {
      console.error('Error handling PDF click:', error);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30, 27, 38, 0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 800, width: '100%', position: 'relative', boxShadow: '0 8px 32px rgba(80,30,120,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#9633eb', fontWeight: 700, transition: 'color 0.2s' }} aria-label="Close">✕</button>
        <h2 style={{ marginBottom: 18, color: '#9633eb', fontWeight: 800, fontSize: 28, letterSpacing: 0.5 }}>Contract Signature</h2>
        
        {/* Business signature UI */}
        {userRole === "business" && !businessSignaturePos && (
          <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button onClick={() => setBusinessDrawMode(false)} style={{ background: !businessDrawMode ? '#9633eb' : '#fff', color: !businessDrawMode ? '#fff' : '#9633eb', border: '1.5px solid #9633eb', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Type</button>
              <button onClick={() => setBusinessDrawMode(true)} style={{ background: businessDrawMode ? '#9633eb' : '#fff', color: businessDrawMode ? '#fff' : '#9633eb', border: '1.5px solid #9633eb', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Draw</button>
            </div>
            {!businessDrawMode ? (
              <input
                type="text"
                placeholder="Type your name to sign"
                value={businessSignature}
                onChange={e => setBusinessSignature(e.target.value)}
                style={{ marginBottom: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16, width: '80%', maxWidth: 320 }}
              />
            ) : (
              <div style={{ marginBottom: 12, border: '1px solid #ccc', borderRadius: 6, background: '#faf8ff' }}>
                <SignatureCanvas
                  ref={businessSigPadRef}
                  penColor="black"
                  backgroundColor="rgba(0,0,0,0)"
                  canvasProps={{ 
                    width: 320, 
                    height: 80, 
                    className: 'sigCanvas',
                    style: { backgroundColor: 'transparent' }
                  }}
                />
                <button style={{ marginTop: 4, fontSize: 13, color: '#9633eb', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => businessSigPadRef.current?.clear()}>Clear</button>
              </div>
            )}
            <button
              onClick={handleBusinessSaveSignature}
              style={{ 
                background: '#9633eb', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '6px 18px', 
                fontWeight: 700, 
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              Create & Place Signature
            </button>
            {placingBusinessSignature && (
              <div style={{ color: '#9633eb', fontWeight: 500, marginBottom: 8 }}>
                Click anywhere on the document to place your signature.
              </div>
            )}
          </div>
        )}

        {userRole === "individual" && !bid.client_signature && !bid.client_signature_image && (
          <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button 
                onClick={() => setClientDrawMode(false)} 
                style={{ 
                  background: !clientDrawMode ? '#9633eb' : '#fff', 
                  color: !clientDrawMode ? '#fff' : '#9633eb', 
                  border: '1.5px solid #9633eb', 
                  borderRadius: 6, 
                  padding: '6px 18px', 
                  fontWeight: 600, 
                  fontSize: 15, 
                  cursor: 'pointer' 
                }}
              >
                Type
              </button>
              <button 
                onClick={() => setClientDrawMode(true)} 
                style={{ 
                  background: clientDrawMode ? '#9633eb' : '#fff', 
                  color: clientDrawMode ? '#fff' : '#9633eb', 
                  border: '1.5px solid #9633eb', 
                  borderRadius: 6, 
                  padding: '6px 18px', 
                  fontWeight: 600, 
                  fontSize: 15, 
                  cursor: 'pointer' 
                }}
              >
                Draw
              </button>
            </div>
            {!clientDrawMode ? (
              <input
                type="text"
                placeholder="Type your name to sign"
                value={clientSignature}
                onChange={e => setClientSignature(e.target.value)}
                style={{ 
                  marginBottom: 12, 
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  border: '1px solid #ccc', 
                  fontSize: 16, 
                  width: '80%', 
                  maxWidth: 320 
                }}
              />
            ) : (
              <div style={{ 
                marginBottom: 12, 
                border: '1px solid #ccc', 
                borderRadius: 6, 
                background: '#faf8ff' 
              }}>
                <SignatureCanvas
                  ref={clientSigPadRef}
                  penColor="black"
                  backgroundColor="rgba(0,0,0,0)"
                  canvasProps={{ 
                    width: 320, 
                    height: 80, 
                    className: 'sigCanvas',
                    style: { backgroundColor: 'transparent' }
                  }}
                />
                <button 
                  style={{ 
                    marginTop: 4, 
                    fontSize: 13, 
                    color: '#9633eb', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer' 
                  }} 
                  onClick={() => clientSigPadRef.current?.clear()}
                >
                  Clear
                </button>
              </div>
            )}
            <button
              onClick={handleClientSaveSignature}
              style={{ 
                background: '#9633eb', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '10px 28px', 
                fontWeight: 700, 
                fontSize: 16, 
                cursor: 'pointer',
                width: '200px'
              }}
            >
              Sign Contract
            </button>
          </div>
        )}

        {clientSignatureBoxPos && placingClientBox === false && userRole === "business" && (
          <button
            onClick={handleSaveClientBox}
            style={{
              marginTop: 20,
              background: '#9633eb',
              color: '#fff',
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Save and Mark as Ready for Client Signature
          </button>
        )}

                {/* Signed states and download button */}
                {bid.business_signed_at && bid.client_signed_at && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{ 
              padding: '16px', 
              background: '#f8fff9', 
              borderRadius: '8px',
              border: '1px solid #4CAF50',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: '#388e3c', 
                fontWeight: 600 
              }}>
                <i className="fas fa-check-circle"></i>
                Contract Signed
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Business signed on {new Date(bid.business_signed_at).toLocaleDateString()}
                <br />
                Client signed on {new Date(bid.client_signed_at).toLocaleDateString()}
              </div>
            </div>
            
            <button 
              onClick={handleDownloadSignedPdf}
              style={{ 
                background: '#4CAF50', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '12px', 
                fontWeight: 600, 
                fontSize: '15px', 
                cursor: 'pointer', 
                boxShadow: '0 2px 4px rgba(76,175,80,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <i className="fas fa-download"></i>
              Download Contract (PDF)
            </button>
          </div>
        )}


        <label style={{ fontWeight: 600, marginBottom: 8, color: '#333', alignSelf: 'flex-start' }}>Contract File:</label>
        <div ref={pdfWrapperRef} 
          onClick={handlePdfAreaClick} 
          style={{ 
            border: (placingBusinessSignature || placingClientBox) ? '2px dashed #9633eb' : '1px solid #e0e0e0',
            cursor: (placingBusinessSignature || placingClientBox) ? 'crosshair' : 'pointer',
            maxWidth: 600,
            minHeight: 400,
            position: 'relative',
            margin: '0 auto 16px auto',
            borderRadius: 8,
            background: '#faf8ff',
            boxShadow: '0 2px 8px rgba(150,51,235,0.04)',
            isolation: 'isolate' // Create new stacking context
          }}
        >
          <Document
            file={bid.contract_url}
            onLoadSuccess={({ numPages }) => { 
              setNumPages(numPages);
              setPdfPage(1); 
              setPdfError(null); 
            }}
            onLoadError={err => setPdfError('Failed to load PDF file. Please check the contract file URL and try again.')}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div style={{ position: 'relative' }}>
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`} 
                  style={{ 
                    marginBottom: index < numPages - 1 ? '20px' : 0,
                    position: 'relative',
                    background: '#fff'
                  }}
                >
                  <Page 
                    key={`page_${index + 1}`}
                    pageNumber={index + 1} 
                    width={600}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onLoadSuccess={(page) => {
                      // Store the actual page dimensions
                      if (index === 0) {
                        const { height } = page.getViewport({ scale: 1 });
                        setBusinessSignaturePos(prev => prev && ({
                          ...prev,
                          y: prev.y % height
                        }));
                      }
                    }}
                  />
                </div>
              ))}

              {/* Signature overlays - positioned relative to the first page */}
              {(placingBusinessSignature || isAdjusting || (!placingBusinessSignature && !isAdjusting && !placingClientBox)) && (
                <>
                  {/* Business signature */}
                  {bid.business_signed_at && bid.business_signature_pos && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                      {bid.business_signature_image_url ? (
                        <img
                          src={bid.business_signature_image_url}
                          alt="Business Signature"
                          style={{
                            position: 'absolute',
                            left: `${JSON.parse(bid.business_signature_pos).x - businessSignatureSize.width / 2}px`,
                            top: `${JSON.parse(bid.business_signature_pos).y - businessSignatureSize.height / 2}px`,
                            width: `${businessSignatureSize.width}px`,
                            height: `${businessSignatureSize.height}px`,
                            pointerEvents: 'none',
                            mixBlendMode: 'multiply',
                            zIndex: 50
                          }}
                        />
                      ) : bid.business_signature && (
                        <div style={{
                          position: 'absolute',
                          left: `${JSON.parse(bid.business_signature_pos).x}px`,
                          top: `${JSON.parse(bid.business_signature_pos).y}px`,
                          color: '#000',
                          fontFamily: 'cursive',
                          fontSize: '24px',
                          zIndex: 50,
                          transform: 'translate(-50%, -50%)'
                        }}>
                          {bid.business_signature}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client signature */}
                  {bid.client_signed_at && bid.client_signature_box_pos && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                      {bid.client_signature_image ? (
                        <img
                          src={bid.client_signature_image}
                          alt="Client Signature"
                          style={{
                            position: 'absolute',
                            left: `${JSON.parse(bid.client_signature_box_pos).x - clientSignatureBoxSize.width / 2}px`,
                            top: `${JSON.parse(bid.client_signature_box_pos).y - clientSignatureBoxSize.height / 2}px`,
                            width: `${clientSignatureBoxSize.width}px`,
                            height: `${clientSignatureBoxSize.height}px`,
                            pointerEvents: 'none',
                            mixBlendMode: 'multiply',
                            zIndex: 50
                          }}
                        />
                      ) : bid.client_signature && (
                        <div style={{
                          position: 'absolute',
                          left: `${JSON.parse(bid.client_signature_box_pos).x}px`,
                          top: `${JSON.parse(bid.client_signature_box_pos).y}px`,
                          color: '#000',
                          fontFamily: 'cursive',
                          fontSize: '24px',
                          zIndex: 50,
                          transform: 'translate(-50%, -50%)'
                        }}>
                          {bid.client_signature}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Document>
          {numPages > 1 && (
            <div style={{ 
              position: 'absolute', 
              bottom: 20, 
              right: 20, 
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '8px 12px',
              borderRadius: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: '14px',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-file-alt"></i>
              {numPages} pages
            </div>
          )}
          {pdfError && (
            <div style={{ color: '#d32f2f', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
              {pdfError}
              <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
                URL: {bid.contract_url || 'No file specified'}
              </div>
            </div>
          )}
          {/* Adjustment controls - moved outside the PDF wrapper and fixed to viewport */}
          {businessSignatureImage && businessSignaturePos && !placingClientBox && (
            <div style={{ 
              position: 'fixed',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 2100,
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(8px)'
            }}>
              <button
                onClick={() => setIsAdjusting(!isAdjusting)}
                style={{
                  background: isAdjusting ? '#fff' : '#9633eb',
                  color: isAdjusting ? '#9633eb' : '#fff',
                  border: isAdjusting ? '2px solid #9633eb' : 'none',
                  borderRadius: 6,
                  padding: '8px 20px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  pointerEvents: 'all'
                }}
              >
                {isAdjusting ? 'Save Position' : 'Adjust Signature'}
              </button>
              {!isAdjusting && (
                <button
                  onClick={() => {
                    console.log('Continue to Client Box clicked');
                    handleSaveBusinessSignature();
                  }}
                  style={{
                    background: '#9633eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 20px',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(150,51,235,0.2)',
                    pointerEvents: 'all'
                  }}
                >
                  Continue to Client Box
                </button>
              )}
            </div>
          )}

          {/* Business signature display */}
          {businessSignatureImage && businessSignaturePos && !placingClientBox && (
            <>
              {isAdjusting ? (
                <div style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  zIndex: 100,
                  pointerEvents: 'none'
                }}>
                  <Draggable
                    position={{
                      x: businessSignaturePos.x - businessSignatureSize.width / 2,
                      y: businessSignaturePos.y - businessSignatureSize.height / 2
                    }}
                    bounds={{
                      left: 0,
                      top: 0,
                      right: pdfWrapperRef.current?.clientWidth - businessSignatureSize.width,
                      bottom: pdfWrapperRef.current?.scrollHeight - businessSignatureSize.height
                    }}
                    onStart={(e, data) => {
                      console.log('Drag started', { x: data.x, y: data.y });
                      setIsDragging(true);
                    }}
                    onDrag={(e, data) => {
                      // Get the current scroll position of the PDF wrapper
                      const scrollTop = pdfWrapperRef.current?.scrollTop || 0;
                      
                      console.log('Dragging', { x: data.x, y: data.y + scrollTop });
                      setBusinessSignaturePos({
                        x: data.x + businessSignatureSize.width / 2,
                        y: data.y + businessSignatureSize.height / 2 + scrollTop
                      });
                    }}
                    onStop={(e, data) => {
                      // Get the current scroll position of the PDF wrapper
                      const scrollTop = pdfWrapperRef.current?.scrollTop || 0;
                      
                      console.log('Drag stopped', { x: data.x, y: data.y + scrollTop });
                      setIsDragging(false);
                      setBusinessSignaturePos({
                        x: data.x + businessSignatureSize.width / 2,
                        y: data.y + businessSignatureSize.height / 2 + scrollTop
                      });
                    }}
                  >
                    <div style={{ 
                      position: 'absolute',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      width: `${businessSignatureSize.width}px`,
                      height: `${businessSignatureSize.height}px`,
                      pointerEvents: 'all',
                      background: 'rgba(255,255,255,0.01)',
                      outline: '2px solid rgba(150,51,235,0.5)'
                    }}>
                      <img
                        src={businessSignatureImage}
                        alt="Business Signature"
                        style={{
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          mixBlendMode: 'multiply',
                          imageRendering: 'pixelated'
                        }}
                      />
                      {/* Resize handle */}
                      <div
                        onMouseDown={handleResizeStart}
                        style={{
                          position: 'absolute',
                          right: -6,
                          bottom: -6,
                          width: 12,
                          height: 12,
                          background: '#9633eb',
                          borderRadius: '50%',
                          cursor: 'nwse-resize',
                          boxShadow: '0 0 0 2px white',
                          pointerEvents: 'all'
                        }}
                      />
                    </div>
                  </Draggable>
                </div>
              ) : (
                <img
                  src={businessSignatureImage}
                  alt="Business Signature"
                  style={{
                    position: 'absolute',
                    left: `${businessSignaturePos.x - businessSignatureSize.width / 2}px`,
                    top: `${businessSignaturePos.y - businessSignatureSize.height / 2}px`,
                    width: `${businessSignatureSize.width}px`,
                    height: `${businessSignatureSize.height}px`,
                    pointerEvents: 'none',
                    mixBlendMode: 'multiply',
                    imageRendering: 'pixelated',
                    zIndex: 50
                  }}
                />
              )}
            </>
          )}

          {/* Client signature box or signature */}
          {clientSignatureBoxPos && (
            <div style={{
              position: 'absolute',
              left: `${clientSignatureBoxPos.x - clientSignatureBoxSize.width / 2}px`,
              top: `${clientSignatureBoxPos.y - clientSignatureBoxSize.height / 2}px`,
              width: `${clientSignatureBoxSize.width}px`,
              height: `${clientSignatureBoxSize.height}px`,
              border: '2px dashed #9633eb',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(150, 51, 235, 0.05)',
              pointerEvents: 'none'
            }}>
              {clientSignatureImage ? (
                <img
                  src={clientSignatureImage}
                  alt="Client Signature"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply'
                  }}
                />
              ) : (
                <span style={{ color: '#9633eb', opacity: 0.5 }}>Sign Here</span>
              )}
            </div>
          )}
        </div>


        {bid.client_signed_at && !bid.business_signed_at && (
          <div style={{ marginTop: 8, color: '#388e3c', fontWeight: 700, fontSize: 18 }}>
            Signed by you: <b>Client</b>
          </div>
        )}

        {userRole === "business" && placingClientBox && (
          <div style={{ 
            marginTop: 16, 
            textAlign: 'center', 
            color: '#9633eb',
            padding: '12px',
            background: 'rgba(150, 51, 235, 0.1)',
            borderRadius: '8px',
            fontWeight: 600
          }}>
            Click where you want the client to sign
          </div>
        )}

        {userRole === "business" && clientSignatureBoxPos && (
          <button
            onClick={handleSaveClientBox}
            style={{
              marginTop: 16,
              background: '#9633eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 16,
              width: '100%'
            }}
          >
            Save Client Signature Box Position
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ContractSignatureModal;
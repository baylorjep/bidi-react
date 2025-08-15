import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { Document, Page } from "react-pdf";
import { pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import Draggable from 'react-draggable';
import { toast } from 'react-hot-toast';
import { supabase } from "../../supabaseClient";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
  
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.js`;

// Add worker initialization check
const initializePdfWorker = async () => {
  try {
    // Check if worker is loaded
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      throw new Error('PDF.js worker source not set');
    }
    
    // Create a simple PDF document to test worker
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText('Test PDF');
    const pdfBytes = await pdfDoc.save();
    
    // Try to load the test PDF
    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    await loadingTask.promise;
    
    console.log('PDF.js worker initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing PDF.js worker:', error);
    return false;
  }
};

// Memoize PDF options
const pdfOptions = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@5.2.133/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.2.133/standard_fonts/'
};

function ContractSignatureModal({
  isOpen,
  onClose,
  bid,
  userRole, // "business" or "individual"
  testSource,
  useTemplate = false, // New prop to indicate if we should use the template
  onContractSigned
}) {
  console.log('ContractSignatureModal rendered with:', {
    isOpen,
    userRole,
    testSource,
    useTemplate,
    bidId: bid?.id,
    hasBusinessSignature: !!(bid?.business_signature || bid?.business_signature_image),
    hasClientSignature: !!bid?.client_signature
  });

  const [pdfError, setPdfError] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [contractTemplate, setContractTemplate] = useState(null);
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
  const dragStartPos = useRef(null);
  const initialPos = useRef(null);
  const [workerInitialized, setWorkerInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Add state for client box adjustment
  const [isAdjustingClientBox, setIsAdjustingClientBox] = useState(false);
  const [clientBoxSize, setClientBoxSize] = useState({ width: 180, height: 60 });
  const clientBoxResizeStartPos = useRef(null);
  const clientBoxInitialSize = useRef(null);
  const clientBoxDragStartPos = useRef(null);
  const clientBoxInitialPos = useRef(null);

  // Add debug logging at component mount
  useEffect(() => {
    console.log('ContractSignatureModal mounted with props:', {
      isOpen,
      bidId: bid?.id,
      hasContractUrl: !!bid?.contract_url,
      hasContractContent: !!bid?.contract_content,
      contractUrl: bid?.contract_url,
      userRole,
      useTemplate
    });
  }, [isOpen, bid, userRole, useTemplate]);

  // Update the function to check for signature placeholders
  const hasTemplateSignaturePlaceholders = (content) => {
    if (!content) return false;
    // Check for both client and business signature placeholders
    const hasClientSignature = content.includes('signature-placeholder client-signature');
    const hasBusinessSignature = content.includes('signature-placeholder business-signature');
    console.log('Signature placeholder check:', { hasClientSignature, hasBusinessSignature, content });
    return hasClientSignature || hasBusinessSignature;
  };

  // Modify the useEffect that handles template content
  useEffect(() => {
    const convertToPdf = async (content) => {
      try {
        // Create a temporary div to hold the content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;

        // Configure html2pdf options
        const opt = {
          margin: 1,
          filename: `contract_${bid.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Generate PDF and create a new ArrayBuffer
        const pdfBlob = await html2pdf().set(opt).from(tempDiv).output('blob');
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        setPdfData(uint8Array);
        setPdfError(null);
      } catch (error) {
        console.error('Error converting to PDF:', error);
        setPdfError('Failed to convert to PDF');
      }
    };

    const fetchTemplate = async () => {
      if (!useTemplate) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("business_profiles")
          .select("contract_template")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (profile?.contract_template) {
          setContractTemplate(profile.contract_template);
          await convertToPdf(profile.contract_template);
        }
      } catch (error) {
        console.error("Error fetching contract template:", error);
        setPdfError("Failed to load contract template");
      }
    };

    fetchTemplate();
  }, [useTemplate, bid.id]);

  // Add worker initialization effect
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      initializePdfWorker()
        .then(success => {
          setWorkerInitialized(success);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to initialize PDF worker:', error);
          setPdfError('Failed to initialize PDF viewer. Please try refreshing the page.');
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  // Memoize the file prop for Document component
  const fileProp = useMemo(() => {
    if (!pdfData) return null;
    return { data: new Uint8Array(pdfData) };
  }, [pdfData]);

  // Memoize the options prop
  const memoizedOptions = useMemo(() => pdfOptions, []);

  // Modify the PDF loading effect
  useEffect(() => {
    const fetchPdfData = async () => {
      if (!workerInitialized || !isOpen) return;

      console.log('Starting PDF fetch process:', {
        hasContractUrl: !!bid?.contract_url,
        hasContractContent: !!bid?.contract_content,
        contractUrl: bid?.contract_url,
        useTemplate
      });

      try {
        if (bid.contract_url) {
          console.log('Attempting to fetch PDF from URL:', bid.contract_url);
          const response = await fetch(bid.contract_url);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          // Create a new Uint8Array from the arrayBuffer and store a copy
          setPdfData(new Uint8Array(arrayBuffer));
          setPdfError(null);
        } else if (bid.contract_content || useTemplate) {
          console.log('Converting contract content to PDF');
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = bid.contract_content || contractTemplate;

          const opt = {
            margin: 1,
            filename: `contract_${bid.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };

          const pdfBlob = await html2pdf().set(opt).from(tempDiv).output('blob');
          const arrayBuffer = await pdfBlob.arrayBuffer();
          // Create a new Uint8Array from the arrayBuffer and store a copy
          setPdfData(new Uint8Array(arrayBuffer));
          setPdfError(null);
        } else {
          setPdfError('No contract content available');
        }
      } catch (error) {
        console.error('Error in PDF loading process:', error);
        setPdfError(`Failed to load contract: ${error.message}`);
      }
    };

    fetchPdfData();
  }, [isOpen, bid.contract_url, bid.contract_content, bid.id, workerInitialized, useTemplate, contractTemplate]);

  // Fetch PDF data for react-pdf
  useEffect(() => {
    const fetchPdfData = async () => {
      if (bid.contract_url && bid.contract_url.endsWith('.pdf')) {
        try {
          const response = await fetch(bid.contract_url);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          setPdfData(uint8Array);
          setPdfError(null);
        } catch (error) {
          console.error('Error fetching PDF:', error);
          setPdfError('Failed to load PDF file. Please check the contract file URL and try again.');
        }
      }
    };

    fetchPdfData();
  }, [bid.contract_url]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup PDF data when component unmounts
      setPdfData(null);
    };
  }, []);

  // Download PDF with both signatures
  const handleDownloadSignedPdf = async () => {
    if (!pdfData) return;
    try {
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Format timestamps
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          timeZone: 'America/Denver',
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

      // Place business signature
      if (bid.business_signature_image_url && businessPos) {
        try {
          // Fetch the business signature image
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
        } catch (error) {
          console.error('Error placing business signature:', error);
          toast.error('Failed to place business signature');
        }
      }
      
      // Place client signature
      if (bid.client_signature_image && clientPos) {
        try {
          // Convert the data URL to a Blob
          const response = await fetch(bid.client_signature_image);
          const imageBytes = await response.arrayBuffer();
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
        } catch (error) {
          console.error('Error placing client signature:', error);
          toast.error('Failed to place client signature');
        }
      }
      
      // Save and download the PDF
      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'signed_contract.pdf');
      
      toast.success('Signed contract downloaded successfully');
    } catch (error) {
      console.error('Error downloading signed PDF:', error);
      toast.error('Failed to download signed contract');
    }
  };

  // Add resize handlers
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

  // Update the business signature drag handlers
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const scrollTop = pdfWrapperRef.current.scrollTop;
    const pageHeight = 792; // Standard letter page height at 72 DPI
    
    dragStartPos.current = { 
      x: e.clientX - rect.left,
      y: e.clientY - rect.top + scrollTop,
      scrollTop,
      pageHeight
    };
    initialPos.current = { ...businessSignaturePos };
    setIsDragging(true);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDrag = (e) => {
    if (!dragStartPos.current || !initialPos.current || !pdfWrapperRef.current) return;
    
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const currentScrollTop = pdfWrapperRef.current.scrollTop;
    const pageHeight = dragStartPos.current.pageHeight;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top + currentScrollTop;
    
    const deltaX = currentX - dragStartPos.current.x;
    const deltaY = currentY - dragStartPos.current.y;
    
    // Calculate which page we're on
    const pageIndex = Math.floor(currentY / pageHeight);
    const yPosInPage = currentY % pageHeight;
    
    const newPos = {
      ...initialPos.current,
      x: initialPos.current.x + deltaX,
      y: currentY,
      pageIndex,
      yPosInPage
    };
    
    console.log('Dragging signature:', { 
      currentY,
      pageIndex,
      yPosInPage,
      deltaY,
      newPos
    });
    
    setBusinessSignaturePos(newPos);
  };

  const handleDragEnd = () => {
    dragStartPos.current = null;
    initialPos.current = null;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Update the client box drag handlers
  const handleClientBoxDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const scrollTop = pdfWrapperRef.current.scrollTop;
    const pageHeight = 792; // Standard letter page height at 72 DPI
    
    clientBoxDragStartPos.current = { 
      x: e.clientX - rect.left,
      y: e.clientY - rect.top + scrollTop,
      scrollTop,
      pageHeight
    };
    clientBoxInitialPos.current = { ...clientSignatureBoxPos };
    document.addEventListener('mousemove', handleClientBoxDrag);
    document.addEventListener('mouseup', handleClientBoxDragEnd);
  };

  const handleClientBoxDrag = (e) => {
    if (!clientBoxDragStartPos.current || !clientBoxInitialPos.current || !pdfWrapperRef.current) return;
    
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const currentScrollTop = pdfWrapperRef.current.scrollTop;
    const pageHeight = clientBoxDragStartPos.current.pageHeight;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top + currentScrollTop;
    
    const deltaX = currentX - clientBoxDragStartPos.current.x;
    const deltaY = currentY - clientBoxDragStartPos.current.y;
    
    // Calculate which page we're on
    const pageIndex = Math.floor(currentY / pageHeight);
    const yPosInPage = currentY % pageHeight;
    
    const newPos = {
      ...clientBoxInitialPos.current,
      x: clientBoxInitialPos.current.x + deltaX,
      y: currentY,
      pageIndex,
      yPosInPage
    };
    
    console.log('Dragging client box:', { 
      currentY,
      pageIndex,
      yPosInPage,
      deltaY,
      newPos
    });
    
    setClientSignatureBoxPos(newPos);
  };

  const handleClientBoxDragEnd = () => {
    clientBoxDragStartPos.current = null;
    clientBoxInitialPos.current = null;
    document.removeEventListener('mousemove', handleClientBoxDrag);
    document.removeEventListener('mouseup', handleClientBoxDragEnd);
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, checking signature placeholders:', {
        contractContent: bid.contract_content,
        hasPlaceholders: hasTemplateSignaturePlaceholders(bid.contract_content),
        userRole,
        businessSigned: bid.business_signed_at,
        clientSigned: bid.client_signed_at
      });
      
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
  }, [isOpen, bid.client_signature_box_pos, bid.contract_content]);

  // Add debug log before client UI render condition
  const shouldShowClientUI = userRole === "individual" && !bid.client_signature && !bid.client_signature_image;
  console.log('Client UI render conditions:', {
    userRole,
    hasClientSignature: !!(bid.client_signature || bid.client_signature_image),
    shouldShowClientUI
  });

  // Business signature save
  const handleBusinessSaveSignature = async () => {
    console.log('Creating signature with:', { businessDrawMode, businessSignature });
    try {
      let sig;
      if (businessDrawMode) {
        if (businessSigPadRef.current && !businessSigPadRef.current.isEmpty()) {
          sig = businessSigPadRef.current.toDataURL();
          console.log('Created signature from drawing');
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
          console.log('Created signature from text');
        }
      }

      if (sig) {
        console.log('Setting signature image and enabling placement');
        setBusinessSignatureImage(sig);
        setPlacingBusinessSignature(true);
        setIsAdjusting(false); // Disable adjustment mode while placing
        
        // If using template, ensure PDF is loaded
        if (useTemplate && !pdfData) {
          toast.error('Please wait for the contract to load before placing your signature');
          return;
        }
      } else {
        console.log('No signature created');
        toast.error('Please provide a signature');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    }
  };

  // Add preview signature function
  const previewBusinessSignature = () => {
    console.log('Previewing signature:', { businessDrawMode, businessSignature });
    
    if (businessDrawMode && businessSigPadRef.current) {
      if (!businessSigPadRef.current.isEmpty()) {
        const sig = businessSigPadRef.current.toDataURL();
        console.log('Setting drawn signature preview');
        setBusinessSignatureImage(sig);
      }
    } else if (businessSignature) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 100;
      ctx.font = '32px cursive';
      ctx.fillStyle = 'black';
      ctx.fillText(businessSignature, 10, 50);
      const sig = canvas.toDataURL();
      console.log('Setting typed signature preview');
      setBusinessSignatureImage(sig);
    }
  };

  // Update signature preview when drawing
  useEffect(() => {
    if (businessDrawMode && businessSigPadRef.current) {
      const updatePreview = () => {
        console.log('Drawing event triggered');
        previewBusinessSignature();
      };

      const canvas = businessSigPadRef.current._canvas;
      if (canvas) {
        canvas.addEventListener('mouseup', updatePreview);
        canvas.addEventListener('touchend', updatePreview);
        return () => {
          canvas.removeEventListener('mouseup', updatePreview);
          canvas.removeEventListener('touchend', updatePreview);
        };
      }
    }
  }, [businessDrawMode]);

  // Clear signature preview when clearing
  const handleClearSignature = () => {
    console.log('Clearing signature');
    if (businessSigPadRef.current) {
      businessSigPadRef.current.clear();
    }
    setBusinessSignature('');
    setBusinessSignatureImage(null);
  };

  // Save business signature position and start client box placement
  const handleSaveBusinessSignature = async () => {
    console.log('Saving business signature with:', {
      signature: businessSignature,
      image: businessSignatureImage,
      pos: businessSignaturePos
    });

    try {
      // First set placing client box to true and turn off adjustment mode
      setPlacingClientBox(true);
      setIsAdjusting(false);
      
      // Save to database in the background
      const { error } = await supabase
        .from('bids')
        .update({
          business_signature: businessSignature,
          business_signature_image: businessSignatureImage,
          business_signature_pos: JSON.stringify(businessSignaturePos),
          business_signed_at: new Date().toISOString()
        })
        .eq('id', bid.id);

      if (error) {
        console.error('Error saving business signature:', error);
        toast.error('Failed to save business signature');
        return;
      }

      toast.success('Click where you want the client to sign');
    } catch (error) {
      console.error('Error in handleSaveBusinessSignature:', error);
      toast.error('Failed to proceed to client signature box placement');
      setPlacingClientBox(false);
    }
  };

  // Add client box resize handlers
  const handleClientBoxResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clientBoxResizeStartPos.current = { x: e.clientX, y: e.clientY };
    clientBoxInitialSize.current = { ...clientBoxSize };
    document.addEventListener('mousemove', handleClientBoxResize);
    document.addEventListener('mouseup', handleClientBoxResizeEnd);
  };

  const handleClientBoxResize = (e) => {
    if (!clientBoxResizeStartPos.current || !clientBoxInitialSize.current) return;
    
    const deltaX = e.clientX - clientBoxResizeStartPos.current.x;
    const deltaY = e.clientY - clientBoxResizeStartPos.current.y;
    
    const aspectRatio = clientBoxInitialSize.current.width / clientBoxInitialSize.current.height;
    const newWidth = Math.max(50, clientBoxInitialSize.current.width + deltaX);
    const newHeight = newWidth / aspectRatio;
    
    setClientBoxSize({
      width: newWidth,
      height: newHeight
    });
  };

  const handleClientBoxResizeEnd = () => {
    clientBoxResizeStartPos.current = null;
    clientBoxInitialSize.current = null;
    document.removeEventListener('mousemove', handleClientBoxResize);
    document.removeEventListener('mouseup', handleClientBoxResizeEnd);
  };

  // Update the client box save handler
  const handleSaveClientBox = async () => {
    console.log('handleSaveClientBox called with:', {
      position: clientSignatureBoxPos,
      size: clientBoxSize
    });
    try {
      // First update the database with the signature data and position
      const { error: updateError } = await supabase
        .from('bids')
        .update({
          client_signature_box_pos: JSON.stringify({
            ...clientSignatureBoxPos,
            width: clientBoxSize.width,
            height: clientBoxSize.height
          }),
          business_signature: businessSignature,
          business_signature_image: businessSignatureImage,
          business_signature_pos: JSON.stringify(businessSignaturePos),
          business_signed_at: new Date().toISOString()
        })
        .eq('id', bid.id);

      if (updateError) {
        console.error('Error saving signature data:', updateError);
        toast.error('Failed to save signature data');
        return;
      }

      // Try to upload the signature image to storage
      try {
        // Convert the data URL to a Blob
        const response = await fetch(businessSignatureImage);
        const blob = await response.blob();
    
        // Upload the business signature image to the 'contracts/signatures' folder
        const { data, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(`signatures/${bid.id}.png`, blob, {
            contentType: 'image/png',
            upsert: true
          });
    
        if (uploadError) {
          console.error('Error uploading signature image:', uploadError);
        } else {
          console.log('Upload successful:', data);
          
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('contracts')
            .getPublicUrl(`signatures/${bid.id}.png`);

          // Update the bid with the public URL
          const { error: urlUpdateError } = await supabase
            .from('bids')
            .update({
              business_signature_image_url: publicUrl
            })
            .eq('id', bid.id);

          if (urlUpdateError) {
            console.error('Error updating signature URL:', urlUpdateError);
          }
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
      }
      
      toast.success('Client signature box placement saved.');
      setIsAdjustingClientBox(false);
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
        // If using template, ensure PDF is loaded
        if (useTemplate && !pdfData) {
          toast.error('Please wait for the contract to load before signing');
          return;
        }

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

        // If both parties have signed, create the final PDF
        if (bid.business_signed_at) {
          // Create a temporary div to hold the contract content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = bid.contract_content || contractTemplate;

          // Convert the content to PDF using html2pdf
          const opt = {
            margin: 1,
            filename: `contract_${bid.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };

          // Generate PDF
          const pdf = await html2pdf().set(opt).from(tempDiv).save();

          // Upload the PDF to Supabase storage
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not found');

          const filePath = `contracts/${user.id}/${bid.id}_contract.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(filePath, pdf, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('contracts')
            .getPublicUrl(filePath);

          // Update the bid with the contract URL and status
          const { error: updateError } = await supabase
            .from('bids')
            .update({ 
              contract_url: publicUrl,
              contract_status: 'completed'
            })
            .eq('id', bid.id);

          if (updateError) throw updateError;
        }

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

  // Update the PDF click handler
  const handlePdfAreaClick = (e) => {
    try {
      if (!pdfWrapperRef.current) return;
      
      const rect = pdfWrapperRef.current.getBoundingClientRect();
      const scrollTop = pdfWrapperRef.current.scrollTop;
      const pageHeight = 792; // Standard letter page height at 72 DPI
      
      // Calculate click position relative to the container and viewport
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + scrollTop;

      console.log('PDF click:', { 
        x, 
        y, 
        scrollTop,
        containerHeight: rect.height,
        clientY: e.clientY,
        rectTop: rect.top,
        placingBusinessSignature, 
        placingClientBox 
      });

      if (placingBusinessSignature) {
        // Calculate which page this Y position falls on
        const pageIndex = Math.floor(y / pageHeight);
        const yPosInPage = y % pageHeight;
        
        console.log('Placing business signature at:', { 
          x, 
          y, 
          pageIndex, 
          yPosInPage,
          pageHeight 
        });

        setBusinessSignaturePos({ 
          x, 
          y,
          pageIndex,
          yPosInPage
        });
        setPlacingBusinessSignature(false);
        setIsAdjusting(true);
      } else if (placingClientBox) {
        // Calculate which page this Y position falls on
        const pageIndex = Math.floor(y / pageHeight);
        const yPosInPage = y % pageHeight;
        
        console.log('Placing client signature box at:', { 
          x, 
          y, 
          pageIndex, 
          yPosInPage,
          pageHeight 
        });

        setClientSignatureBoxPos({ 
          x, 
          y,
          pageIndex,
          yPosInPage
        });
        setPlacingClientBox(false);
        setIsAdjustingClientBox(true);
      }
    } catch (error) {
      console.error('Error handling PDF click:', error);
      toast.error('Failed to place signature');
    }
  };

  // Add function to replace variables in contract content
  const replaceContractVariables = (content) => {
    if (!content || !bid) return content;

    // Define all possible variables and their values
    const variables = {
      clientName: bid.client_name || 'Client',
      eventDate: bid.event_date || 'TBD',
      eventTime: bid.event_time || 'TBD',
      eventLocation: bid.event_location || 'TBD',
      servicesDescription: bid.services_description || bid.description || 'Services as described',
      priceBreakdown: bid.price_breakdown || `$${bid.amount}`,
      totalAmount: `$${bid.amount}`,
      downPaymentAmount: bid.down_payment ? `$${bid.down_payment}` : 'N/A',
      signatureDate: new Date().toLocaleDateString('en-US', {
          timeZone: 'America/Denver',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Replace all variables in the content
    let processedContent = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  };

  // Modify the Document component's onLoadSuccess handler
  const handlePdfLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully:', {
      numPages,
      pdfDataLength: pdfData?.length
    });
    setNumPages(numPages);
    setPdfPage(1);
    setPdfError(null);
  };

  // Add debug effect for signature state
  useEffect(() => {
    console.log('Signature state updated:', {
      businessSignature,
      businessSignatureImage,
      businessSignaturePos,
      placingBusinessSignature,
      businessDrawMode
    });
  }, [businessSignature, businessSignatureImage, businessSignaturePos, placingBusinessSignature, businessDrawMode]);

  // Add debug logging for signature positions
  useEffect(() => {
    console.log('Signature positions updated:', {
      businessSignaturePos,
      businessSignatureImage,
      clientSignatureBoxPos,
      clientSignatureImage
    });
  }, [businessSignaturePos, businessSignatureImage, clientSignatureBoxPos, clientSignatureImage]);

  // Update the signature position calculation function
  const calculateSignaturePosition = (pos, pageHeight) => {
    if (!pos) return null;
    
    // If we already have pageIndex and yPosInPage, use them
    if (pos.pageIndex !== undefined && pos.yPosInPage !== undefined) {
      return {
        pageIndex: pos.pageIndex,
        x: pos.x,
        y: pos.yPosInPage
      };
    }
    
    // Otherwise calculate them
    const pageIndex = Math.floor(pos.y / pageHeight);
    const yPosInPage = pos.y % pageHeight;
    
    return {
      pageIndex,
      x: pos.x,
      y: yPosInPage
    };
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30, 27, 38, 0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 800, width: '100%', position: 'relative', boxShadow: '0 8px 32px rgba(80,30,120,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#9633eb', fontWeight: 700, transition: 'color 0.2s' }} aria-label="Close">✕</button>
        <h2 style={{ marginBottom: 18, color: '#9633eb', fontWeight: 800, fontSize: 28, letterSpacing: 0.5 }}>Contract Signature</h2>
        
        {/* Business signature UI */}
        {userRole === "business" && !bid.business_signed_at && !bid.client_signed_at && !hasTemplateSignaturePlaceholders(bid.contract_content || contractTemplate) && (
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
                <button 
                  style={{ 
                    marginTop: 4, 
                    fontSize: 13, 
                    color: '#9633eb', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer' 
                  }} 
                  onClick={handleClearSignature}
                >
                  Clear
                </button>
              </div>
            )}
            
            {/* Add signature preview */}
            {businessSignatureImage && (
              <div style={{ 
                marginTop: 12, 
                padding: '8px', 
                border: '1px solid #e0e0e0', 
                borderRadius: 6,
                background: '#fff'
              }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Signature Preview:</div>
                <img 
                  src={businessSignatureImage} 
                  alt="Signature Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    maxHeight: '60px'
                  }} 
                />
              </div>
            )}

            <button
              onClick={handleBusinessSaveSignature}
              style={{ 
                marginTop: 16,
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
              <div style={{ color: '#9633eb', fontWeight: 500, marginTop: 8 }}>
                Click anywhere on the document to place your signature.
              </div>
            )}
          </div>
        )}

        {userRole === "individual" && !bid.client_signature && !bid.client_signature_image && !hasTemplateSignaturePlaceholders(bid.contract_content || contractTemplate) && (
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

        {clientSignatureBoxPos && placingClientBox === false && userRole === "business" && !bid.business_signed_at && !bid.client_signed_at && !hasTemplateSignaturePlaceholders(bid.contract_content || contractTemplate) && (
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
                Business signed on {new Date(bid.business_signed_at).toLocaleDateString('en-US', { timeZone: 'America/Denver' })}
                <br />
                Client signed on {new Date(bid.client_signed_at).toLocaleDateString('en-US', { timeZone: 'America/Denver' })}
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
            <button
              onClick={() => {
                if (typeof onContractSigned === 'function') onContractSigned();
                onClose();
              }}
              style={{
                background: '#9633eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                marginTop: '8px',
                width: '100%'
              }}
            >
              Done
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
            isolation: 'isolate',
            overflow: 'auto'
          }}
        >
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666',
              fontSize: '16px'
            }}>
              Initializing PDF viewer...
            </div>
          ) : !workerInitialized ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#dc3545',
              fontSize: '16px'
            }}>
              Failed to initialize PDF viewer. Please refresh the page.
            </div>
          ) : pdfData ? (
            <Document
              file={fileProp}
              onLoadSuccess={handlePdfLoadSuccess}
              onLoadError={err => {
                console.error('PDF load error:', {
                  error: err,
                  pdfDataLength: pdfData?.length
                });
                setPdfError('Failed to load PDF file. Please try again.');
              }}
              loading={
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#666',
                  fontSize: '16px'
                }}>
                  Loading contract...
                </div>
              }
              options={memoizedOptions}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {Array.from(new Array(numPages), (el, index) => {
                const pageNumber = index + 1;
                const pageHeight = 792; // Standard letter page height at 72 DPI
                
                // Calculate signature positions for this page
                const businessPos = businessSignaturePos || (bid.business_signature_pos ? JSON.parse(bid.business_signature_pos) : null);
                const clientPos = clientSignatureBoxPos || (bid.client_signature_box_pos ? JSON.parse(bid.client_signature_box_pos) : null);
                
                const businessPosOnPage = businessPos ? calculateSignaturePosition(businessPos, pageHeight) : null;
                const clientPosOnPage = clientPos ? calculateSignaturePosition(clientPos, pageHeight) : null;

                return (
                  <div key={`page_${pageNumber}`} style={{ position: 'relative' }}>
                    <Page 
                      pageNumber={pageNumber} 
                      width={600}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      onRenderSuccess={() => console.log(`Page ${pageNumber} rendered successfully`)}
                      onRenderError={(error) => console.error(`Error rendering page ${pageNumber}:`, error)}
                      loading={
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%',
                          color: '#666',
                          fontSize: '16px'
                        }}>
                          Loading page {pageNumber}...
                        </div>
                      }
                    />
                    
                    {/* Signature overlays for this page */}
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 100
                    }}>
                      {/* Business signature */}
                      {businessPosOnPage && businessPosOnPage.pageIndex === index && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${businessPosOnPage.x}px`,
                            top: `${businessPosOnPage.y}px`,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: isAdjusting ? 'auto' : 'none',
                            cursor: isAdjusting ? 'move' : 'default'
                          }}
                          onMouseDown={isAdjusting ? handleDragStart : undefined}
                        >
                          {businessSignatureImage || bid.business_signature_image ? (
                            <div style={{ position: 'relative' }}>
                              <img
                                src={businessSignatureImage || bid.business_signature_image}
                                alt="Business Signature"
                                style={{
                                  width: `${businessSignatureSize.width}px`,
                                  height: `${businessSignatureSize.height}px`,
                                  pointerEvents: 'none'
                                }}
                              />
                              {isAdjusting && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: -8,
                                    bottom: -8,
                                    width: 16,
                                    height: 16,
                                    background: '#9633eb',
                                    borderRadius: '50%',
                                    cursor: 'nwse-resize'
                                  }}
                                  onMouseDown={handleResizeStart}
                                />
                              )}
                            </div>
                          ) : (
                            <div style={{
                              color: '#000',
                              fontFamily: 'cursive',
                              fontSize: '24px',
                              pointerEvents: 'none'
                            }}>
                              {businessSignature || bid.business_signature}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Client signature */}
                      {clientPosOnPage && clientPosOnPage.pageIndex === index && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${clientPosOnPage.x}px`,
                            top: `${clientPosOnPage.y}px`,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: isAdjustingClientBox ? 'auto' : 'none',
                            cursor: isAdjustingClientBox ? 'move' : 'default',
                            zIndex: 100
                          }}
                          onMouseDown={isAdjustingClientBox ? handleClientBoxDragStart : undefined}
                        >
                          <div style={{ 
                            position: 'relative',
                            border: '2px dashed #9633eb',
                            width: `${clientBoxSize.width}px`,
                            height: `${clientBoxSize.height}px`,
                            background: 'rgba(150, 51, 235, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9633eb',
                            fontWeight: 500,
                            fontSize: '14px',
                            userSelect: 'none'
                          }}>
                            Client Signature
                            {isAdjustingClientBox && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: -8,
                                  bottom: -8,
                                  width: 16,
                                  height: 16,
                                  background: '#9633eb',
                                  borderRadius: '50%',
                                  cursor: 'nwse-resize',
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  zIndex: 101
                                }}
                                onMouseDown={handleClientBoxResizeStart}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add placement overlay */}
              {placingBusinessSignature && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(150, 51, 235, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 90
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#9633eb',
                    fontWeight: 600,
                    fontSize: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(150,51,235,0.2)'
                  }}>
                    Scroll to the desired page and click to place your signature
                  </div>
                </div>
              )}
            </Document>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666',
              fontSize: '16px'
            }}>
              {pdfError || 'Loading contract...'}
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

        {userRole === "business" && clientSignatureBoxPos && !bid.business_signed_at && !bid.client_signed_at && (
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

        {/* Add adjustment controls */}
        {businessSignaturePos && !placingBusinessSignature && !placingClientBox && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsAdjusting(!isAdjusting)}
              style={{
                background: isAdjusting ? '#9633eb' : '#fff',
                color: isAdjusting ? '#fff' : '#9633eb',
                border: '1.5px solid #9633eb',
                borderRadius: 6,
                padding: '6px 18px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              {isAdjusting ? 'Done Adjusting' : 'Adjust Signature'}
            </button>
            {isAdjusting && (
              <button
                onClick={handleSaveBusinessSignature}
                style={{
                  background: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >
                Save Position
              </button>
            )}
          </div>
        )}

        {/* Add client box adjustment controls */}
        {clientSignatureBoxPos && !placingBusinessSignature && !placingClientBox && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsAdjustingClientBox(!isAdjustingClientBox)}
              style={{
                background: isAdjustingClientBox ? '#9633eb' : '#fff',
                color: isAdjustingClientBox ? '#fff' : '#9633eb',
                border: '1.5px solid #9633eb',
                borderRadius: 6,
                padding: '6px 18px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              {isAdjustingClientBox ? 'Done Adjusting' : 'Adjust Client Box'}
            </button>
            {isAdjustingClientBox && (
              <button
                onClick={handleSaveClientBox}
                style={{
                  background: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >
                Save Position
              </button>
            )}
          </div>
        )}

        {/* Update placement overlay */}
        {placingClientBox && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(150, 51, 235, 0.1)',
            pointerEvents: 'none',
            zIndex: 90
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#9633eb',
              fontWeight: 600,
              fontSize: '16px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(150,51,235,0.2)'
            }}>
              Scroll to the desired page and click to place the client signature box
            </div>
          </div>
        )}

        {/* Add next signature box button */}
        {placingClientBox && (
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 2000,
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                const pdfWrapper = pdfWrapperRef.current;
                if (pdfWrapper) {
                  pdfWrapper.scrollBy({
                    top: 100,
                    behavior: 'smooth'
                  });
                }
              }}
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
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(150,51,235,0.2)'
              }}
            >
              <i className="fas fa-arrow-down"></i>
              Scroll Down
            </button>
            <button
              onClick={() => {
                setPlacingClientBox(false);
                onClose();
              }}
              style={{
                background: '#4CAF50',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(76,175,80,0.2)'
              }}
            >
              <i className="fas fa-check"></i>
              Done Placing
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ContractSignatureModal;
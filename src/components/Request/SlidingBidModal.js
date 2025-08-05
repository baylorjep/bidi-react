import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import RequestDisplay from './RequestDisplay';
import { Modal, Button } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import BidDisplay from '../Bid/BidDisplay';
import LoadingSpinner from '../LoadingSpinner';
import './SlidingBidModal.css';
import { FaPlus, FaTrash } from 'react-icons/fa';

// iPhone-style Toggle Component
const IPhoneToggle = ({ checked, onChange, disabled = false }) => {
    return (
        <div
            style={{
                position: 'relative',
                width: '51px',
                height: '31px',
                backgroundColor: checked ? '#755df1' : '#E9E9EA',
                borderRadius: '16px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                opacity: disabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
            }}
            onClick={() => !disabled && onChange(!checked)}
        >
            <div
                style={{
                    width: '27px',
                    height: '27px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transform: `translateX(${checked ? '20px' : '0px'})`,
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            />
        </div>
    );
};

const sendEmailNotification = async (recipientEmail, subject, htmlContent) => {
    try {
        await fetch('https://bidi-express.vercel.app/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipientEmail, subject, htmlContent }),
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image'
];

// Robust helper to parse various date formats as local date
function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  // If ISO string, let Date handle it
  if (dateString.includes('T')) {
    const d = new Date(dateString);
    return isNaN(d) ? null : d;
  }
  // Handle 'YYYY-MM-DD' and 'YYYY-MM-DD HH:mm:ss'
  const datePart = dateString.split(' ')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) {
    console.warn('parseLocalDate: Malformed date string:', dateString);
    return null;
  }
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(d) ? null : d;
}

function SlidingBidModal({ isOpen, onClose, requestId }) {
    const [requestDetails, setRequestDetails] = useState(null);
    const [requestType, setRequestType] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [bidDescription, setBidDescription] = useState('');
    const [bidExpirationDate, setBidExpirationDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [servicePhotos, setServicePhotos] = useState([]);
    const [connectedAccountId, setConnectedAccountId] = useState(null);
    const [Bidi_Plus, setBidiPlus] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [bidTemplate, setBidTemplate] = useState('');
    const [bidDescriptionError, setBidDescriptionError] = useState('');
    const [defaultExpirationDays, setDefaultExpirationDays] = useState(null);
    const [discountType, setDiscountType] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [discountDeadline, setDiscountDeadline] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [profileImage, setProfileImage] = useState("/images/default.jpg");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
    const [bidStats, setBidStats] = useState({ min: null, max: null, avg: null });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [currentTranslateY, setCurrentTranslateY] = useState(0);
    const modalRef = useRef(null);
    const [isToolboxOpen, setIsToolboxOpen] = useState(true);

    // New state for itemized quotes
    const [lineItems, setLineItems] = useState([
        { id: 1, description: '', quantity: 1, rate: '', amount: 0 }
    ]);
    const [taxRate, setTaxRate] = useState(0);
    const [useItemizedQuote, setUseItemizedQuote] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isOpen && requestId) {
            fetchRequestDetails();
            fetchStripeStatus();
            fetchBidTemplate();
            fetchBusinessProfile();
            fetchBidStats();
            // Reset drag state when modal opens
            setCurrentTranslateY(0);
            setIsDragging(false);
        }
    }, [isOpen, requestId]);

    const fetchRequestDetails = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const requestTables = [
            { name: 'beauty_requests', type: 'beauty' },
            { name: 'requests', type: 'regular' },
            { name: 'photography_requests', type: 'photography' },
            { name: 'dj_requests', type: 'dj' },
            { name: 'catering_requests', type: 'catering' },
            { name: 'videography_requests', type: 'videography' },
            { name: 'florist_requests', type: 'florist' },
            { name: 'wedding_planning_requests', type: 'wedding planning' }
        ];

        let foundTable = null;
        let foundData = null;

        for (const table of requestTables) {
            const { data, error } = await supabase
                .from(table.name)
                .select('*')
                .eq('id', requestId)
                .single();

            if (data && !error) {
                foundTable = table.name;
                foundData = data;
                break;
            }
        }

        if (foundTable && foundData) {
            setRequestDetails({ ...foundData, table_name: foundTable });
            setRequestType(foundTable);

            if (foundTable === 'videography_requests' || foundTable === 'wedding_planning_requests') {
                const photoTable = foundTable === 'videography_requests' ? 'videography_photos' : 'wedding_planning_photos';
                const { data: photos, error } = await supabase
                    .from(photoTable)
                    .select('*')
                    .eq('request_id', requestId);

                if (photos && !error) {
                    setServicePhotos(photos);
                }
            }
        }
    };

    const fetchStripeStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('business_profiles')
                .select('stripe_account_id, Bidi_Plus, default_expiration_days')
                .eq('id', user.id)
                .single();

            if (profile?.stripe_account_id) {
                setConnectedAccountId(profile.stripe_account_id);
            }
            if (profile?.Bidi_Plus) {
                setBidiPlus(true);
            }
            if (profile?.default_expiration_days) {
                setDefaultExpirationDays(profile.default_expiration_days);
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + profile.default_expiration_days);
                setBidExpirationDate(expirationDate.toISOString().split('T')[0]);
            }
            
            // Check if user needs to set up Stripe account
            const needsStripeSetup = !profile?.stripe_account_id && !profile?.Bidi_Plus;
            console.log('Profile:', profile);
            console.log('Needs Stripe setup:', needsStripeSetup);
            console.log('stripe_account_id:', profile?.stripe_account_id);
            console.log('Bidi_Plus:', profile?.Bidi_Plus);
            
            if (needsStripeSetup) {
                console.log('User needs Stripe setup - showing modal');
                setShowModal(true);
            } else {
                console.log('User has Stripe setup or Bidi Plus');
                setShowModal(false);
            }
        }
    };

    const fetchBidTemplate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('business_profiles')
                .select('bid_template')
                .eq('id', user.id)
                .single();

            if (profile?.bid_template) {
                setBidTemplate(profile.bid_template);
                setBidDescription(profile.bid_template);
            }
        }
    };

    const fetchBusinessProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) setBusinessProfile(profile);

        const { data: photo } = await supabase
            .from('profile_photos')
            .select('photo_url')
            .eq('user_id', user.id)
            .eq('photo_type', 'profile')
            .single();

        if (photo && photo.photo_url) setProfileImage(photo.photo_url);
    };

    const fetchBidStats = async () => {
        try {
            const { data: bids, error } = await supabase
                .from('bids')
                .select('bid_amount')
                .eq('request_id', requestId);

            if (error) throw error;

            if (bids && bids.length > 0) {
                const amounts = bids.map(bid => parseFloat(bid.bid_amount));
                setBidStats({
                    min: Math.min(...amounts),
                    max: Math.max(...amounts),
                    avg: amounts.reduce((a, b) => a + b, 0) / amounts.length
                });
            }
        } catch (error) {
            console.error('Error fetching bid statistics:', error);
        }
    };

    const validateBidDescription = (content) => {
        const phoneRegex = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const linkRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
        const socialMediaTerms = /\b(?:IG|instagram|FB|facebook)\b/i;

        const hasPhone = phoneRegex.test(content);
        const hasEmail = emailRegex.test(content);
        const hasLink = linkRegex.test(content);
        const hasSocialMedia = socialMediaTerms.test(content);

        if (hasPhone || hasEmail || hasLink || hasSocialMedia) {
            let errorMessage = "Please remove the following from your bid:";
            if (hasPhone) errorMessage += "\n- Phone numbers";
            if (hasEmail) errorMessage += "\n- Email addresses";
            if (hasLink) errorMessage += "\n- Website links";
            if (hasSocialMedia) errorMessage += "\n- Social media references (IG, Instagram, FB, Facebook)";
            errorMessage += "\n\nAll contact information should be managed through your Bidi profile.";
            setBidDescriptionError(errorMessage);
            return false;
        }

        setBidDescriptionError('');
        return true;
    };

    const handleBidDescriptionChange = (content) => {
        setBidDescription(content);
        validateBidDescription(content);
    };

    // Calculate subtotal from line items
    const calculateSubtotal = () => {
        return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    // Calculate tax amount
    const calculateTax = () => {
        return (calculateSubtotal() * taxRate) / 100;
    };

    // Calculate discount amount
    const calculateDiscount = () => {
        if (!discountType || !discountValue) return 0;
        const subtotalWithTax = calculateSubtotal() + calculateTax();
        if (discountType === 'percentage') {
            return (subtotalWithTax * parseFloat(discountValue)) / 100;
        } else {
            return parseFloat(discountValue) || 0;
        }
    };

    // Calculate total amount with discount
    const calculateTotal = () => {
        const subtotalWithTax = calculateSubtotal() + calculateTax();
        return subtotalWithTax - calculateDiscount();
    };

    // Add new line item
    const addLineItem = () => {
        const newId = Math.max(...lineItems.map(item => item.id), 0) + 1;
        setLineItems([...lineItems, { id: newId, description: '', quantity: 1, rate: '', amount: 0 }]);
    };

    // Remove line item
    const removeLineItem = (id) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    // Update line item
    const updateLineItem = (id, field, value) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    const quantity = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
                    const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
                    updatedItem.amount = quantity * rate;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    // Update bid amount when total changes (use original total, not discounted)
    useEffect(() => {
        if (useItemizedQuote) {
            const originalTotal = calculateSubtotal() + calculateTax();
            setBidAmount(originalTotal.toString());
        }
    }, [lineItems, taxRate, useItemizedQuote]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Submit button clicked');
        console.log('connectedAccountId:', connectedAccountId);
        console.log('Bidi_Plus:', Bidi_Plus);

        // Check if user needs to set up Stripe account
        if (!connectedAccountId && !Bidi_Plus) {
            console.log('User needs Stripe setup - showing modal in handleSubmit');
            setShowModal(true);
            return;
        }

        if (!validateBidDescription(bidDescription)) {
            return;
        }

        setIsLoading(true);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                setError('You need to be signed in to place a bid.');
                setIsLoading(false);
                return;
            }

            const categoryMap = {
                'requests': 'General',
                'photography_requests': 'Photography',
                'dj_requests': 'DJ',
                'catering_requests': 'Catering',
                'videography_requests': 'Videography',
                'florist_requests': 'Florist',
                'beauty_requests': 'Beauty',
                'wedding_planning_requests': 'Wedding Planning'
            };

            const category = categoryMap[requestType] || 'General';

            // Prepare bid data with itemized quote information
            const bidData = {
                request_id: requestId,
                user_id: user.id,
                bid_amount: parseFloat(bidAmount).toFixed(2),
                bid_description: bidDescription,
                category: category,
                ...(bidExpirationDate && { expiration_date: bidExpirationDate }),
                discount_type: discountType || null,
                discount_value: discountType ? discountValue : null,
                discount_deadline: discountType ? discountDeadline : null,
            };

            // Add itemized quote data if enabled
            if (useItemizedQuote) {
                bidData.line_items = lineItems.filter(item => item.amount > 0);
                bidData.subtotal = calculateSubtotal();
                bidData.tax = calculateTax();
                bidData.tax_rate = taxRate;
            }

            const { error: insertError } = await supabase
                .from('bids')
                .insert([bidData]);

            if (insertError) throw insertError;

            const subject = 'New Bid Received';
            const htmlContent = `<p>A new bid has been placed on your request.</p>
                                  <p><strong>Bid Amount:</strong> ${bidAmount}</p>
                                  <p><strong>Description:</strong> ${bidDescription}</p>
                                  <p><strong>Expires:</strong> ${parseLocalDate(bidExpirationDate) ? parseLocalDate(bidExpirationDate).toLocaleDateString() : 'Date not specified'}</p>`;

            await sendEmailNotification('savewithbidi@gmail.com', subject, htmlContent);
            setSuccess('Bid successfully placed!');
            onClose();
            navigate('/bid-success');
        } catch (err) {
            setError(`Error placing bid: ${err.message}`);
        }

        setIsLoading(false);
    };

    // Drag functionality
    const handleTouchStart = (e) => {
        // Only initiate drag if touching the header area or handle
        const target = e.target;
        const headerArea = target.closest('.sbm-drag-header');
        if (!headerArea && !target.classList.contains('sbm-drag-handle')) return;
        
        // Don't initiate drag if clicking the close button
        if (target.classList.contains('sbm-close-btn')) return;
        
        setIsDragging(true);
        setDragStartY(e.touches[0].clientY);
        setCurrentTranslateY(0);
        
        // Prevent default to avoid scrolling while dragging
        e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        
        const currentY = e.touches[0].clientY;
        const diff = currentY - dragStartY;
        const modalHeight = window.innerHeight;
        const threshold = modalHeight * 0.3; // 30% threshold for momentum
        
        // Add smooth damping effect
        if (diff > 0) { // Only allow downward drag
            let dampedDiff;
            if (diff > threshold) {
                // Add extra resistance after threshold
                const extraDiff = diff - threshold;
                dampedDiff = threshold + (extraDiff * 0.5);
            } else {
                dampedDiff = diff;
            }
            dampedDiff = Math.min(dampedDiff, modalHeight);
            setCurrentTranslateY(dampedDiff);
        }
        
        // Prevent scrolling while dragging
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        
        setIsDragging(false);
        const modalHeight = window.innerHeight;
        const threshold = modalHeight * 0.3; // 30% threshold for momentum
        
        const modal = document.querySelector('.sbm-modal');
        modal.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy effect
        
        if (currentTranslateY > threshold) {
            // Use momentum to complete the closing animation
            const finalTranslate = modalHeight * 1.1; // Slightly overshoot
            setCurrentTranslateY(finalTranslate);
            setTimeout(() => {
                onClose();
            }, 500);
        } else {
            // Snap back with a slight bounce
            setCurrentTranslateY(0);
        }
    };

    const handleMouseDown = (e) => {
        if (!isMobile) return;
        // Only initiate drag if clicking the header area or handle
        const target = e.target;
        const headerArea = target.closest('.sbm-drag-header');
        if (!headerArea && !target.classList.contains('sbm-drag-handle')) return;
        
        // Don't initiate drag if clicking the close button
        if (target.classList.contains('sbm-close-btn')) return;

        setIsDragging(true);
        setDragStartY(e.clientY);
        setCurrentTranslateY(0);
        
        // Prevent text selection while dragging
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !isMobile) return;
        
        const currentY = e.clientY;
        const diff = currentY - dragStartY;
        const modalHeight = window.innerHeight;
        const threshold = modalHeight * 0.3; // 30% threshold for momentum
        
        if (diff > 0) {
            let dampedDiff;
            if (diff > threshold) {
                // Add extra resistance after threshold
                const extraDiff = diff - threshold;
                dampedDiff = threshold + (extraDiff * 0.5);
            } else {
                dampedDiff = diff;
            }
            dampedDiff = Math.min(dampedDiff, modalHeight);
            setCurrentTranslateY(dampedDiff);
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        
        setIsDragging(false);
        const modalHeight = window.innerHeight;
        const threshold = modalHeight * 0.3; // 30% threshold for momentum
        
        const modal = document.querySelector('.sbm-modal');
        modal.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy effect
        
        if (currentTranslateY > threshold) {
            // Use momentum to complete the closing animation
            const finalTranslate = modalHeight * 1.1; // Slightly overshoot
            setCurrentTranslateY(finalTranslate);
            setTimeout(() => {
                onClose();
            }, 500);
        } else {
            // Snap back with a slight bounce
            setCurrentTranslateY(0);
        }
    };

    const previewBid = {
        bid_amount: bidAmount || 0,
        discount_type: discountType || null,
        discount_value: discountType ? discountValue : null,
        discount_deadline: discountType ? discountDeadline : null,
        bid_description: bidDescription || '',
        expiration_date: bidExpirationDate || null,
        business_profiles: businessProfile
          ? { ...businessProfile, profile_image: profileImage }
          : {
              business_name: "Your Business Name",
              profile_image: "/images/default.jpg",
              id: "preview-business-id"
            },
        status: "pending",
        // Add itemized quote data to preview
        ...(useItemizedQuote && {
            line_items: lineItems.filter(item => item.amount > 0),
            subtotal: calculateSubtotal(),
            tax: calculateTax(),
            tax_rate: taxRate
        })
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="sbm-modal-backdrop"
                onClick={onClose}
            />

            {/* Sliding Modal */}
            <div
                ref={modalRef}
                className="sbm-modal"
                style={{
                    top: isMobile ? 0 : '20px',
                    bottom: isMobile ? 0 : '20px',
                    left: isMobile ? 0 : '50%',
                    right: isMobile ? 0 : 'auto',
                    borderRadius: isMobile ? 0 : '12px',
                    transform: isMobile 
                        ? `translateY(${isOpen ? 0 : '100%'}) translateY(${currentTranslateY}px)`
                        : `translateX(-50%) translateY(${isOpen ? 0 : '-100%'})`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Draggable Header Area */}
                {isMobile && (
                    <div className="sbm-drag-header">
                        <div className="sbm-drag-handle" />
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="sbm-close-btn"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                )}
                {!isMobile && (
                    <button
                        onClick={onClose}
                        className="sbm-close-btn"
                        aria-label="Close"
                    >
                        ×
                    </button>
                )}

                {/* Content */}
                <div className="sbm-content">
                    {/* Full Request Display */}
                    <RequestDisplay
                        request={requestDetails}
                        servicePhotos={servicePhotos}
                        hideBidButton={true}
                        requestType={requestType}
                        loading={isLoading || (!requestDetails && !error)}
                    />

                    {/* Bid Form */}
                    <form onSubmit={handleSubmit} style={{ maxWidth:'900px', marginLeft:'auto', marginRight:'auto' }}>
                        <div className="sbm-form-section-title">Bid</div>
                        
                        {/* Bid Statistics */}
                        {bidStats.min !== null && (
                            <div className="sbm-bid-stats">
                                <div className="sbm-bid-stats-title">Current Bid Statistics</div>
                                <div className="sbm-bid-stats-grid">
                                    <div className="sbm-bid-stat">
                                        <div className="sbm-bid-stat-label">Lowest Bid</div>
                                        <div className="sbm-bid-stat-value">${bidStats.min?.toFixed(2)}</div>
                                    </div>
                                    <div className="sbm-bid-stat">
                                        <div className="sbm-bid-stat-label">Average Bid</div>
                                        <div className="sbm-bid-stat-value">${bidStats.avg?.toFixed(2)}</div>
                                    </div>
                                    <div className="sbm-bid-stat">
                                        <div className="sbm-bid-stat-label">Highest Bid</div>
                                        <div className="sbm-bid-stat-value">${bidStats.max?.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Itemized Quote Toggle */}
                        <div className="sbm-itemized-toggle">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IPhoneToggle
                                    checked={useItemizedQuote}
                                    onChange={() => setUseItemizedQuote(!useItemizedQuote)}
                                />
                                <span style={{ fontSize: 16 }}>Create Itemized Quote</span>
                            </label>
                        </div>

                        {/* Itemized Quote Section */}
                        {useItemizedQuote ? (
                            <div className="sbm-itemized-section">
                                <div className="sbm-itemized-header">
                                    <h4>Service Breakdown</h4>
                                    <button 
                                        type="button"
                                        className="sbm-add-line-item-btn"
                                        onClick={addLineItem}
                                    >
                                        <FaPlus /> Add Service
                                    </button>
                                </div>
                                
                                <div className="sbm-itemized-help">
                                    <p><strong>Itemize your services:</strong> List each service or item separately. For example: "Wedding Photography" (8 hours × $150), "Bouquet Design" (1 item × $200), etc.</p>
                                </div>
                                
                                <div className="sbm-line-items-list">
                                    {lineItems.map((item) => (
                                        <div key={item.id} className="sbm-line-item">
                                            <div className="sbm-line-item-row">
                                                <div className="sbm-line-item-description">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., Wedding Photography, Bouquet Design, DJ Services"
                                                        value={item.description}
                                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="sbm-line-item-quantity">
                                                    <input
                                                        type="number"
                                                        placeholder="Hours/Qty"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                                                    />
                                                </div>
                                                <div className="sbm-line-item-rate">
                                                    <input
                                                        type="number"
                                                        placeholder="$ per hour/item"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.rate}
                                                        onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                                                    />
                                                </div>
                                                <div className="sbm-line-item-amount">
                                                    ${(item.amount || 0).toFixed(2)}
                                                </div>
                                                <div className="sbm-line-item-actions">
                                                    <button
                                                        type="button"
                                                        className="sbm-remove-line-item-btn"
                                                        onClick={() => removeLineItem(item.id)}
                                                        disabled={lineItems.length === 1}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Tax Section */}
                                <div className="sbm-tax-section">
                                    <div className="sbm-tax-input">
                                        <label>Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                        />
                                        <small>Leave as 0 if no tax applies</small>
                                    </div>
                                </div>

                                {/* Payment Summary */}
                                <div className="sbm-payment-summary">
                                    <h4>Payment Summary</h4>
                                    {lineItems.filter(item => item.amount > 0).map((item, index) => (
                                        <div key={index} className="sbm-summary-row">
                                            <span>{item.description || `Item ${index + 1}`} - {item.quantity} x ${item.rate}</span>
                                            <span>${item.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {taxRate > 0 && (
                                        <div className="sbm-summary-row">
                                            <span>Tax ({taxRate}%)</span>
                                            <span>${calculateTax().toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discountType && discountValue && (
                                        <div className="sbm-summary-row sbm-discount">
                                            <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`})</span>
                                            <span>-${calculateDiscount().toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="sbm-summary-row sbm-total">
                                        <span>Total Amount:</span>
                                        <span>${calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Simple Bid Amount Input */
                            <input
                                className="sbm-input"
                                id="bidAmount"
                                name="bidAmount"
                                type="number"
                                placeholder="Enter Price"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                required
                            />
                        )}

                        {/* Toolbox Toggle */}
                        <div
                            className="rdm-collapsible-header sbm-toolbox-toggle"
                            onClick={() => setIsToolboxOpen((open) => !open)}
                        >
                            <span style={{ fontSize: 20, marginRight: 8 }}>🧰</span>
                            <span>Bid Options</span>
                            <span style={{ marginLeft: 'auto', transition: 'transform 0.2s', color: '#9633eb', display: 'flex', alignItems: 'center' }}>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{
                                        transform: isToolboxOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <path
                                        d="M6 9L12 15L18 9"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </div>
                        {/* Toolbox for Expiration Date and Discount */}
                        <div
                            className="sbm-toolbox"
                            style={{
                                maxHeight: isToolboxOpen ? 500 : 0,
                                overflow: 'hidden',
                                transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s',
                                padding: isToolboxOpen ? undefined : '0 16px',
                                opacity: isToolboxOpen ? 1 : 0.5
                            }}
                        >
                            <div className="sbm-discount-label">Expiration Date</div>
                            <input
                                className="sbm-input"
                                id="bidExpirationDate"
                                name="bidExpirationDate"
                                type="date"
                                value={bidExpirationDate}
                                onChange={(e) => setBidExpirationDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                                                            <div style={{ marginTop: "12px" }} className="sbm-discount-label">Discount (Optional)</div>
                            <div className="sbm-discount-section">

                                <div className="sbm-discount-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <IPhoneToggle
                                            checked={!!discountType}
                                            onChange={() => setDiscountType(discountType ? '' : 'percentage')}
                                            disabled={!connectedAccountId && !Bidi_Plus}
                                        />
                                        <span style={{ fontSize: 16 }}>{discountType ? 'Yes' : 'No'}</span>
                                    </label>
                                    {discountType && (
                                        <>
                                            <select
                                                value={discountType}
                                                onChange={e => setDiscountType(e.target.value)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '14px',
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <option value="percentage">%</option>
                                                <option value="flat">$</option>
                                            </select>
                                            <input
                                                className="sbm-discount-value"
                                                id="discountValue"
                                                name="discountValue"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder={discountType === 'percentage' ? '%' : '$'}
                                                value={discountValue}
                                                onChange={e => setDiscountValue(e.target.value)}
                                                required
                                            />
                                            <span className="sbm-discount-percent">
                                                {discountType === 'percentage' ? '%' : ''}
                                            </span>
                                        </>
                                    )}
                                </div>
                                {discountType && (
                                    <div style={{ width: '100%', marginTop: 12 }}>
                                        <div className="sbm-discount-label">Discount Deadline (Optional)</div>
                                        <input
                                            className="sbm-input"
                                            id="discountDeadline"
                                            name="discountDeadline"
                                            type="date"
                                            value={discountDeadline}
                                            onChange={e => setDiscountDeadline(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #ddd',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Message Section */}
                        <div className="sbm-discount-label">Message</div>
                        <ReactQuill
                            className="sbm-quill"
                            theme="snow"
                            value={bidDescription}
                            onChange={handleBidDescriptionChange}
                            modules={{ toolbar: [] }}
                        />
                        {/* Bottom Buttons */}
                        <div className="sbm-btn-row">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="sbm-btn sbm-btn-close"
                            >
                                Close
                            </button>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="sbm-btn sbm-btn-submit"
                            >
                                {isLoading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Stripe Modal */}
                {console.log('Modal show state:', showModal)}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Stripe Account Setup Required</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="d-flex flex-column align-items-center justify-content-center">
                        <p className="text-center">
                            To place bids and get paid for jobs you win, you'll need to set up a payment account. Bidi won't charge you to talk to users or bid — a small fee is only deducted after you've been paid.
                        </p>
                        <Button className="btn-secondary" onClick={() => navigate("/stripe-setup")}>Set Up Account</Button>
                    </Modal.Body>
                </Modal>
            </div>
        </>
    );
}

export default SlidingBidModal; 
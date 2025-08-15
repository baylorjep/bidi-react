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
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet'
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

function SlidingBidModal({ isOpen, onClose, requestId, editMode = false, bidId = null }) {
    console.log('=== SlidingBidModal rendered ===');
    console.log('requestId prop:', requestId);
    console.log('requestId type:', typeof requestId);
    
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
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [currentTranslateY, setCurrentTranslateY] = useState(0);
    const modalRef = useRef(null);
    const [isToolboxOpen, setIsToolboxOpen] = useState(true);
    const [originalBidData, setOriginalBidData] = useState(null);
    const popoutRef = useRef(null);

    // New state for itemized quotes
    const [lineItems, setLineItems] = useState([
        { id: 1, description: '', quantity: 1, rate: '', amount: 0 }
    ]);
    const [taxRate, setTaxRate] = useState(0);
    const [useItemizedQuote, setUseItemizedQuote] = useState(false);
    
    // New state for add-ons
    const [addOns, setAddOns] = useState([
        { id: 1, description: '', quantity: 1, rate: '', amount: 0 }
    ]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Monitor requestType changes
    useEffect(() => {
        console.log('=== requestType state changed ===');
        console.log('New requestType value:', requestType);
        console.log('New requestType type:', typeof requestType);
    }, [requestType]);

    useEffect(() => {
        if (isOpen && requestId) {
            console.log('=== Modal opened, fetching details ===');
            console.log('Current requestType state:', requestType);
            fetchRequestDetails();
            fetchStripeStatus();
            if (editMode && bidId) {
                fetchExistingBidData();
            } else {
                fetchBidTemplate();
            }
            fetchBusinessProfile();
            // Reset drag state when modal opens
            setCurrentTranslateY(0);
            setIsDragging(false);
        }
    }, [isOpen, requestId, editMode, bidId]);

    const fetchRequestDetails = async () => {
        console.log('=== fetchRequestDetails called ===');
        console.log('requestId:', requestId);
        console.log('requestId type:', typeof requestId);
        
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
            console.log(`Checking table: ${table.name}`);
            const { data, error } = await supabase
                .from(table.name)
                .select('*')
                .eq('id', requestId)
                .single();

            if (data && !error) {
                console.log(`Found request in table: ${table.name}`);
                console.log('Request data:', data);
                foundTable = table.name;
                foundData = data;
                break;
            } else if (error) {
                console.log(`Error checking ${table.name}:`, error);
            }
        }

        if (foundTable && foundData) {
            console.log(`Setting requestType to: ${foundTable}`);
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
        } else {
            console.log('No request found in any table');
            console.log('requestId searched for:', requestId);
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

    const fetchExistingBidData = async () => {
        try {
            const { data: bidData, error } = await supabase
                .from("bids")
                .select("*")
                .eq("id", bidId)
                .single();

            if (error) throw error;

            setOriginalBidData(bidData);
            setBidAmount(bidData.bid_amount);
            setBidDescription(bidData.bid_description);
            setBidExpirationDate(bidData.expiration_date || '');
            setDiscountType(bidData.discount_type || '');
            setDiscountValue(bidData.discount_value || '');
            setDiscountDeadline(bidData.discount_deadline || '');

            // Handle itemized quote data if it exists
            if (bidData.line_items && bidData.line_items.length > 0) {
                setUseItemizedQuote(true);
                setLineItems(bidData.line_items);
                setTaxRate(bidData.tax_rate || 0);
            }
        } catch (error) {
            console.error("Error fetching bid data:", error);
            setError("Failed to load bid data");
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

    // Calculate subtotal from line items and add-ons
    const calculateSubtotal = () => {
        const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const addOnsTotal = addOns.reduce((sum, addon) => sum + (addon.amount || 0), 0);
        return lineItemsTotal + addOnsTotal;
    };

    const calculateTotal = () => {
        if (useItemizedQuote) {
            const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
            const addOnsTotal = addOns.reduce((sum, addon) => sum + (addon.amount || 0), 0);
            const subtotal = lineItemsTotal + addOnsTotal;
            const tax = calculateTax(subtotal);
            const discount = calculateDiscount(subtotal);
            return subtotal + tax - discount;
        }
        return parseFloat(bidAmount) || 0;
    };

    const calculateTax = (subtotal = null) => {
        if (useItemizedQuote) {
            const baseSubtotal = subtotal || (lineItems.reduce((sum, item) => sum + (item.amount || 0), 0) + 
                                            addOns.reduce((sum, addon) => sum + (addon.amount || 0), 0));
            return (baseSubtotal * taxRate) / 100;
        }
        return 0;
    };

    const calculateDiscount = (subtotal = null) => {
        if (!discountType || !discountValue) return 0;
        
        if (useItemizedQuote) {
            const baseSubtotal = subtotal || (lineItems.reduce((sum, item) => sum + (item.amount || 0), 0) + 
                                            addOns.reduce((sum, addon) => sum + (addon.amount || 0), 0));
            
        if (discountType === 'percentage') {
                return (baseSubtotal * parseFloat(discountValue)) / 100;
        } else {
                return parseFloat(discountValue);
            }
        } else {
            if (discountType === 'percentage') {
                return ((parseFloat(bidAmount) || 0) * parseFloat(discountValue)) / 100;
            } else {
                return parseFloat(discountValue);
            }
        }
    };

    // Helper functions for add-ons
    const addAddOn = () => {
        const newId = Math.max(...addOns.map(a => a.id), 0) + 1;
        setAddOns([...addOns, { id: newId, description: '', quantity: 1, rate: '', amount: 0 }]);
    };

    const removeAddOn = (id) => {
        if (addOns.length > 1) {
            setAddOns(addOns.filter(addon => addon.id !== id));
        }
    };

    const updateAddOn = (id, field, value) => {
        setAddOns(addOns.map(addon => {
            if (addon.id === id) {
                const updated = { ...addon, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0);
                }
                return updated;
            }
            return addon;
        }));
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
        console.log('editMode:', editMode);

        // Check if user needs to set up Stripe account (only for new bids)
        if (!editMode && !connectedAccountId && !Bidi_Plus) {
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

            console.log('=== Category Mapping Debug ===');
            console.log('requestType:', requestType);
            console.log('requestType type:', typeof requestType);
            console.log('categoryMap keys:', Object.keys(categoryMap));
            console.log('categoryMap[requestType]:', categoryMap[requestType]);

            const category = categoryMap[requestType] || 'General';
            console.log('Final category:', category);

            // Prepare bid data with itemized quote information
            const bidData = {
                bid_amount: parseFloat(bidAmount).toFixed(2),
                bid_description: bidDescription,
                ...(bidExpirationDate && { expiration_date: bidExpirationDate }),
                discount_type: discountType || null,
                discount_value: discountType ? discountValue : null,
                discount_deadline: discountType ? discountDeadline : null,
            };

            // Only add these fields for new bids
            if (!editMode) {
                bidData.request_id = requestId;
                bidData.user_id = user.id;
                bidData.category = category;
                
                console.log('=== Creating new bid ===');
                console.log('bidData.request_id:', bidData.request_id);
                console.log('bidData.user_id:', bidData.user_id);
                console.log('bidData.category:', bidData.category);
                console.log('Full bidData:', bidData);
            }

            // Add itemized quote data if enabled
            if (useItemizedQuote) {
                bidData.line_items = lineItems.filter(item => item.amount > 0);
                bidData.add_ons = addOns.filter(addon => addon.amount > 0);
                bidData.subtotal = calculateSubtotal();
                bidData.tax = calculateTax();
                bidData.tax_rate = taxRate;
            } else {
                // Clear itemized quote data if not using it
                bidData.line_items = null;
                bidData.add_ons = null;
                bidData.subtotal = null;
                bidData.tax = null;
                bidData.tax_rate = null;
            }

            if (editMode && bidId) {
                // Update existing bid
                bidData.last_edited_at = new Date().toISOString();
                
                const { error: updateError } = await supabase
                    .from('bids')
                    .update(bidData)
                    .eq('id', bidId);

                if (updateError) throw updateError;
                
                setSuccess('Bid updated successfully!');
                onClose();
                navigate('/business-dashboard/bids');
            } else {
                // Create new bid
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
            }
        } catch (err) {
            setError(`Error ${editMode ? 'updating' : 'placing'} bid: ${err.message}`);
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
                <div className="sbm-content" style={{ position: 'relative' }}>
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
                        <div className="sbm-form-section-title">{editMode ? 'Edit Bid' : 'Bid'}</div>
                        
                        {/* Top Right Corner Options */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: isMobile ? '12px' : '12px',
                            justifyContent: isMobile ? 'stretch' : 'flex-end',
                            zIndex: 10
                        }}>
                            {/* Itemized Quote Toggle */}
                            <div className="sbm-itemized-toggle" style={{
                                background: 'white',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                width: isMobile ? '100%' : 'auto'
                            }}>
                                <label style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8, 
                                    margin: 0,
                                    justifyContent: isMobile ? 'center' : 'flex-start'
                                }}>
                                    <IPhoneToggle
                                        checked={useItemizedQuote}
                                        onChange={() => setUseItemizedQuote(!useItemizedQuote)}
                                    />
                                    <span style={{ fontSize: 14, fontWeight: '500' }}>Itemized Quote</span>
                                </label>
                            </div>

                            {/* Bid Options Toggle */}
                            <div className="sbm-toolbox-toggle" style={{
                                background: 'white',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                position: 'relative',
                                width: isMobile ? '100%' : 'auto'
                            }} onClick={() => setIsToolboxOpen(!isToolboxOpen)}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    justifyContent: isMobile ? 'center' : 'flex-start'
                                }}>
                                    <span style={{ fontSize: 16 }}>🧰</span>
                                    <span style={{ fontSize: 14, fontWeight: '500' }}>Bid Options</span>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{
                                            transform: isToolboxOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease',
                                            marginLeft: '4px'
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
                                </div>
                                
                                {/* Bid Options Popout */}
                                {isToolboxOpen && (
                                    <div 
                                        ref={popoutRef}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: isMobile ? '50%' : '0',
                                            left: isMobile ? '50%' : 'auto',
                                            transform: isMobile ? 'translateX(-50%)' : 'none',
                                            marginTop: '8px',
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                            padding: '20px',
                                            minWidth: isMobile ? 'calc(100vw - 32px)' : '300px',
                                            maxWidth: isMobile ? '400px' : 'none',
                                            zIndex: 1000,
                                            animation: 'slideIn 0.2s ease-out'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '16px',
                                            paddingBottom: '12px',
                                            borderBottom: '1px solid #f3f4f6'
                                        }}>
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                                Bid Options
                                            </h4>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsToolboxOpen(false);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    fontSize: '18px',
                                                    cursor: 'pointer',
                                                    color: '#6b7280',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        
                                        <div style={{ marginBottom: '16px' }}>
                                            <div className="sbm-discount-label" style={{ marginBottom: '8px' }}>Expiration Date</div>
                                            <input
                                                className="sbm-input"
                                                id="bidExpirationDate"
                                                name="bidExpirationDate"
                                                type="date"
                                                value={bidExpirationDate}
                                                onChange={(e) => setBidExpirationDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        
                                        <div style={{ marginBottom: '16px' }}>
                                            <div className="sbm-discount-label" style={{ marginBottom: '8px' }}>Discount (Optional)</div>
                                            <div className="sbm-discount-section">
                                                <div className="sbm-discount-row" style={{ 
                                                    display: 'flex', 
                                                    flexDirection: isMobile ? 'column' : 'row',
                                                    alignItems: isMobile ? 'stretch' : 'center', 
                                                    gap: '12px', 
                                                    flexWrap: 'wrap', 
                                                    marginBottom: '12px' 
                                                }}>
                                                    <label style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 8,
                                                        justifyContent: isMobile ? 'center' : 'flex-start'
                                                    }}>
                                                        <IPhoneToggle
                                                            checked={!!discountType}
                                                            onChange={() => setDiscountType(discountType ? '' : 'percentage')}
                                                            disabled={!connectedAccountId && !Bidi_Plus}
                                                        />
                                                        <span style={{ fontSize: 14 }}>{discountType ? 'Yes' : 'No'}</span>
                                                    </label>
                                                    {discountType && (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: isMobile ? 'column' : 'row',
                                                            gap: '8px',
                                                            alignItems: 'center',
                                                            justifyContent: isMobile ? 'center' : 'flex-start'
                                                        }}>
                                                            <select
                                                                value={discountType}
                                                                onChange={e => setDiscountType(e.target.value)}
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #d1d5db',
                                                                    fontSize: '14px',
                                                                    backgroundColor: 'white',
                                                                    minWidth: '60px'
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
                                                                style={{
                                                                    width: isMobile ? '100%' : '80px',
                                                                    padding: '6px 10px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #d1d5db',
                                                                    fontSize: '14px'
                                                                }}
                                                            />
                                                            <span className="sbm-discount-percent" style={{ fontSize: '14px', color: '#6b7280' }}>
                                                                {discountType === 'percentage' ? '%' : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {discountType && (
                                                    <div style={{ width: '100%' }}>
                                                        <div className="sbm-discount-label" style={{ marginBottom: '8px' }}>Discount Deadline (Optional)</div>
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
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #d1d5db',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                                                {/* Main Price Section - Centered and Prominent */}
                        <div style={{
                            textAlign: 'center',
                            margin: isMobile ? '20px 0' : '40px 0',
                            padding: isMobile ? '20px' : '40px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '16px',
                            border: '2px solid #e2e8f0'
                        }}>
                            <h2 style={{
                                fontSize: isMobile ? '1.25rem' : '1.5rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '24px'
                            }}>
                                {editMode ? 'Edit Your Bid Amount' : 'Enter Your Bid Amount'}
                            </h2>
                            
                        {useItemizedQuote ? (
                                /* Itemized Quote Total Display */
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        fontSize: isMobile ? '2.5rem' : '3rem',
                                        fontWeight: '700',
                                        color: '#059669',
                                        marginBottom: '8px'
                                    }}>
                                        ${calculateTotal().toFixed(2)}
                                    </div>
                                    <div style={{
                                        fontSize: isMobile ? '0.875rem' : '1rem',
                                        color: '#6b7280',
                                        marginBottom: '16px'
                                    }}>
                                        Total Amount (including tax & discounts)
                                    </div>
                                </div>
                            ) : (
                                /* Simple Bid Amount Input */
                                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                        fontSize: isMobile ? '1.5rem' : '2rem',
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: '16px'
                                    }}>
                                        $
                                    </div>
                                    <input
                                        className="sbm-input"
                                        id="bidAmount"
                                        name="bidAmount"
                                        type="number"
                                        placeholder="0.00"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        required
                                        style={{
                                            fontSize: isMobile ? '1.75rem' : '2.5rem',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            border: '2px solid #d1d5db',
                                            borderRadius: '12px',
                                            padding: isMobile ? '12px 16px' : '16px 24px',
                                            width: isMobile ? '150px' : '200px',
                                            background: 'white'
                                        }}
                                    />
                                </div>
                            )}
                            
                            <div style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                fontStyle: 'italic'
                            }}>
                                {useItemizedQuote 
                                    ? 'Amount calculated from your itemized services below'
                                    : 'Enter the total amount for your services'
                                }
                            </div>
                        </div>

                        {/* Itemized Quote Section */}
                        {useItemizedQuote && (
                            <div className="sbm-itemized-section" style={{
                                background: '#f8fafc',
                                borderRadius: '16px',
                                padding: isMobile ? '16px' : '24px',
                                margin: '24px 0',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div className="sbm-itemized-header" style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile ? 'stretch' : 'center',
                                    gap: isMobile ? '12px' : '0',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                                        Service Breakdown
                                    </h4>
                                    <button 
                                        type="button"
                                        className="sbm-add-line-item-btn"
                                        onClick={addLineItem}
                                        style={{
                                            background: '#059669',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            width: isMobile ? '100%' : 'auto'
                                        }}
                                    >
                                        <FaPlus /> Add Service
                                    </button>
                                </div>
                                
                                <div className="sbm-itemized-help" style={{
                                    background: 'white',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                                        <strong>💡 Tip:</strong> Set your core services that are always included, then add optional add-ons that clients can choose from.
                                    </p>
                                </div>
                                
                                {/* Core Services Section */}
                                <div style={{
                                    background: 'white',
                                    padding: isMobile ? '16px' : '20px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <h5 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                        🔧 Core Services (Always Included)
                                    </h5>
                                <div className="sbm-line-items-list">
                                        {/* Column Headers - Mobile Responsive */}
                                        <div className="sbm-line-item-header" style={{
                                            display: isMobile ? 'none' : 'grid',
                                            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                            gap: '16px',
                                            padding: '12px 16px',
                                            background: '#f8fafc',
                                            borderBottom: '2px solid #e5e7eb',
                                            borderRadius: '8px 8px 0 0',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            color: '#6b7280',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <div>Service</div>
                                            <div>Qty</div>
                                            <div>Rate</div>
                                            <div>Total</div>
                                            <div></div>
                                        </div>
                                        
                                        {lineItems.map((item, index) => (
                                            <div key={item.id} className="sbm-line-item" style={{
                                                background: 'white',
                                                borderBottom: '1px solid #f3f4f6',
                                                borderRadius: index === lineItems.length - 1 ? '0 0 8px 8px' : '0',
                                                padding: isMobile ? '16px' : '0'
                                            }}>
                                                {isMobile ? (
                                                    // Mobile Layout - Stacked Cards
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                color: '#6b7280',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                Service {index + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="sbm-remove-line-item-btn"
                                                                onClick={() => removeLineItem(item.id)}
                                                                disabled={lineItems.length === 1}
                                                                style={{
                                                                    background: lineItems.length === 1 ? '#f3f4f6' : '#fee2e2',
                                                                    color: lineItems.length === 1 ? '#9ca3af' : '#dc2626',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '8px',
                                                                    cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px'
                                                                }}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                        
                                                        <input
                                                            type="text"
                                                            placeholder="Service name..."
                                                            value={item.description}
                                                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: '8px',
                                                                fontSize: '16px',
                                                                background: 'white'
                                                            }}
                                                        />
                                                        
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '12px'
                                                        }}>
                                                            <div>
                                                                <label style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6b7280',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    Quantity
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="1"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: '8px',
                                                                        fontSize: '16px',
                                                                        textAlign: 'center',
                                                                        background: 'white'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6b7280',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    Rate ($)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.rate}
                                                                    onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: '8px',
                                                                        fontSize: '16px',
                                                                        textAlign: 'center',
                                                                        background: 'white'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '12px',
                                                            background: '#f0fdf4',
                                                            borderRadius: '8px',
                                                            border: '1px solid #bbf7d0'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                color: '#374151'
                                                            }}>
                                                                Total:
                                                            </span>
                                                            <span style={{
                                                                fontSize: '18px',
                                                                fontWeight: '700',
                                                                color: '#059669'
                                                            }}>
                                                                ${(item.amount || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Desktop Layout - Grid
                                                    <div className="sbm-line-item-row" style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                                        gap: '16px',
                                                        alignItems: 'center',
                                                        padding: '16px'
                                                    }}>
                                                    <div className="sbm-line-item-description">
                                                        <input
                                                            type="text"
                                                                placeholder="Service name..."
                                                            value={item.description}
                                                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    background: 'white'
                                                                }}
                                                        />
                                                    </div>
                                                    <div className="sbm-line-item-quantity">
                                                        <input
                                                            type="number"
                                                                placeholder="1"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    textAlign: 'center',
                                                                    background: 'white'
                                                                }}
                                                        />
                                                    </div>
                                                    <div className="sbm-line-item-rate">
                                                        <input
                                                            type="number"
                                                                placeholder="0.00"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.rate}
                                                            onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    textAlign: 'center',
                                                                    background: 'white'
                                                                }}
                                                        />
                                                    </div>
                                                        <div className="sbm-line-item-amount" style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            color: '#059669',
                                                            textAlign: 'center'
                                                        }}>
                                                        ${(item.amount || 0).toFixed(2)}
                                                    </div>
                                                    <div className="sbm-line-item-actions">
                                                        <button
                                                            type="button"
                                                            className="sbm-remove-line-item-btn"
                                                            onClick={() => removeLineItem(item.id)}
                                                            disabled={lineItems.length === 1}
                                                                style={{
                                                                    background: lineItems.length === 1 ? '#f3f4f6' : '#fee2e2',
                                                                    color: lineItems.length === 1 ? '#9ca3af' : '#dc2626',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '8px',
                                                                    cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px'
                                                                }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add-ons Section */}
                                <div style={{
                                    background: 'white',
                                    padding: isMobile ? '16px' : '20px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: isMobile ? 'stretch' : 'center',
                                        gap: isMobile ? '12px' : '0',
                                        marginBottom: '16px'
                                    }}>
                                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                            ✨ Optional Add-ons
                                        </h5>
                                        <button 
                                            type="button"
                                            onClick={addAddOn}
                                            style={{
                                                background: '#7c3aed',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                width: isMobile ? '100%' : 'auto'
                                            }}
                                        >
                                            <FaPlus /> Add Add-on
                                        </button>
                                    </div>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                                        These are optional services that clients can choose to add when they view your bid
                                    </p>
                                    
                                    <div className="sbm-line-items-list">
                                        {/* Column Headers - Mobile Responsive */}
                                        <div className="sbm-line-item-header" style={{
                                            display: isMobile ? 'none' : 'grid',
                                            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                            gap: '16px',
                                            padding: '12px 16px',
                                            background: '#f8fafc',
                                            borderBottom: '2px solid #e5e7eb',
                                            borderRadius: '8px 8px 0 0',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            color: '#6b7280',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <div>Service</div>
                                            <div>Qty</div>
                                            <div>Rate</div>
                                            <div>Total</div>
                                            <div></div>
                                        </div>
                                        
                                        {addOns.map((addon, index) => (
                                            <div key={addon.id} className="sbm-line-item" style={{
                                                background: 'white',
                                                borderBottom: '1px solid #f3f4f6',
                                                borderRadius: index === addOns.length - 1 ? '0 0 8px 8px' : '0',
                                                padding: isMobile ? '16px' : '0'
                                            }}>
                                                {isMobile ? (
                                                    // Mobile Layout - Stacked Cards
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                color: '#6b7280',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                Add-on {index + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAddOn(addon.id)}
                                                                disabled={addOns.length === 1}
                                                                style={{
                                                                    background: addOns.length === 1 ? '#f3f4f6' : '#fee2e2',
                                                                    color: addOns.length === 1 ? '#9ca3af' : '#dc2626',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '8px',
                                                                    cursor: addOns.length === 1 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px'
                                                                }}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                        
                                                        <input
                                                            type="text"
                                                            placeholder="Add-on service name..."
                                                            value={addon.description}
                                                            onChange={(e) => updateAddOn(addon.id, 'description', e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: '8px',
                                                                fontSize: '16px',
                                                                background: 'white'
                                                            }}
                                                        />
                                                        
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '12px'
                                                        }}>
                                                            <div>
                                                                <label style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6b7280',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    Quantity
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="1"
                                                                    min="1"
                                                                    value={addon.quantity}
                                                                    onChange={(e) => updateAddOn(addon.id, 'quantity', e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: '8px',
                                                                        fontSize: '16px',
                                                                        textAlign: 'center',
                                                                        background: 'white'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6b7280',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    Rate ($)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={addon.rate}
                                                                    onChange={(e) => updateAddOn(addon.id, 'rate', e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: '8px',
                                                                        fontSize: '16px',
                                                                        textAlign: 'center',
                                                                        background: 'white'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '12px',
                                                            background: '#faf5ff',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9d5ff'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                color: '#374151'
                                                            }}>
                                                                Total:
                                                            </span>
                                                            <span style={{
                                                                fontSize: '18px',
                                                                fontWeight: '700',
                                                                color: '#7c3aed'
                                                            }}>
                                                                ${(addon.amount || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Desktop Layout - Grid
                                                    <div className="sbm-line-item-row" style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                                        gap: '16px',
                                                        alignItems: 'center',
                                                        padding: '16px'
                                                    }}>
                                                        <div className="sbm-line-item-description">
                                                            <input
                                                                type="text"
                                                                placeholder="Add-on service name..."
                                                                value={addon.description}
                                                                onChange={(e) => updateAddOn(addon.id, 'description', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    background: 'white'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="sbm-line-item-quantity">
                                                            <input
                                                                type="number"
                                                                placeholder="1"
                                                                min="1"
                                                                value={addon.quantity}
                                                                onChange={(e) => updateAddOn(addon.id, 'quantity', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    textAlign: 'center',
                                                                    background: 'white'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="sbm-line-item-rate">
                                                            <input
                                                                type="number"
                                                                placeholder="0.00"
                                                                min="0"
                                                                step="0.01"
                                                                value={addon.rate}
                                                                onChange={(e) => updateAddOn(addon.id, 'rate', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    textAlign: 'center',
                                                                    background: 'white'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="sbm-line-item-amount" style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            color: '#059669',
                                                            textAlign: 'center'
                                                        }}>
                                                            ${(addon.amount || 0).toFixed(2)}
                                                        </div>
                                                        <div className="sbm-line-item-actions">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAddOn(addon.id)}
                                                                disabled={addOns.length === 1}
                                                                style={{
                                                                    background: addOns.length === 1 ? '#f3f4f6' : '#fee2e2',
                                                                    color: addOns.length === 1 ? '#9ca3af' : '#dc2626',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '8px',
                                                                    cursor: addOns.length === 1 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px'
                                                                }}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                                {/* Tax Section */}
                        <div className="sbm-tax-section" style={{
                            background: 'white',
                            padding: isMobile ? '16px' : '20px',
                            borderRadius: '8px',
                            marginTop: '20px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div className="sbm-tax-input" style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'stretch' : 'center',
                                gap: isMobile ? '12px' : '16px',
                                flexWrap: 'wrap'
                            }}>
                                <label style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '500', 
                                    color: '#374151', 
                                    minWidth: isMobile ? 'auto' : '80px',
                                    textAlign: isMobile ? 'center' : 'left'
                                }}>
                                    Tax Rate:
                                </label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    justifyContent: isMobile ? 'center' : 'flex-start'
                                }}>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            width: isMobile ? '100px' : '80px',
                                            textAlign: 'center',
                                            background: 'white'
                                        }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>%</span>
                                </div>
                                <small style={{ 
                                    fontSize: '12px', 
                                    color: '#9ca3af', 
                                    fontStyle: 'italic',
                                    textAlign: isMobile ? 'center' : 'left'
                                }}>
                                    Leave as 0 if no tax applies
                                </small>
                            </div>
                        </div>

                                {/* Payment Summary */}
                        <div className="sbm-payment-summary" style={{
                            background: 'white',
                            padding: isMobile ? '16px' : '20px',
                            borderRadius: '8px',
                            marginTop: '20px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <h4 style={{ 
                                margin: '0 0 16px 0', 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#374151',
                                textAlign: isMobile ? 'center' : 'left'
                            }}>
                                Summary
                            </h4>
                            
                            {/* Core Services */}
                            {lineItems.filter(item => item.amount > 0).map((item, index) => (
                                <div key={index} className="sbm-summary-row" style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: isMobile ? 'center' : 'space-between',
                                    alignItems: isMobile ? 'center' : 'flex-start',
                                    padding: isMobile ? '12px 0' : '8px 0',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    gap: isMobile ? '8px' : '0'
                                }}>
                                    <span style={{ 
                                        textAlign: isMobile ? 'center' : 'left',
                                        wordBreak: 'break-word'
                                    }}>
                                        {item.description || `Core Service ${index + 1}`}
                                    </span>
                                    <span style={{
                                        fontSize: isMobile ? '16px' : '14px',
                                        fontWeight: isMobile ? '600' : '400',
                                        color: isMobile ? '#059669' : '#6b7280'
                                    }}>
                                        ${item.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            
                            {/* Selected Add-ons */}
                            {addOns.filter(addon => addon.amount > 0).map((addon, index) => (
                                <div key={index} className="sbm-summary-row" style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: isMobile ? 'center' : 'space-between',
                                    alignItems: isMobile ? 'center' : 'flex-start',
                                    padding: isMobile ? '12px 0' : '8px 0',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    gap: isMobile ? '8px' : '0'
                                }}>
                                    <span style={{ 
                                        textAlign: isMobile ? 'center' : 'left',
                                        wordBreak: 'break-word'
                                    }}>
                                        ✨ {addon.description || `Add-on ${index + 1}`}
                                    </span>
                                    <span style={{
                                        fontSize: isMobile ? '16px' : '14px',
                                        fontWeight: isMobile ? '600' : '400',
                                        color: isMobile ? '#7c3aed' : '#6b7280'
                                    }}>
                                        ${addon.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            
                            {/* Subtotal */}
                            <div className="sbm-summary-row" style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                justifyContent: isMobile ? 'center' : 'space-between',
                                alignItems: isMobile ? 'center' : 'flex-start',
                                padding: '12px 0 8px 0',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                borderBottom: '1px solid #e5e7eb',
                                marginTop: '8px',
                                gap: isMobile ? '8px' : '0'
                            }}>
                                <span style={{ textAlign: isMobile ? 'center' : 'left' }}>Subtotal</span>
                                <span style={{ textAlign: isMobile ? 'center' : 'right' }}>
                                    ${(lineItems.reduce((sum, item) => sum + (item.amount || 0), 0) + 
                                       addOns.reduce((sum, addon) => sum + (addon.amount || 0), 0)).toFixed(2)}
                                </span>
                            </div>
                            
                            {taxRate > 0 && (
                                <div className="sbm-summary-row" style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: isMobile ? 'center' : 'space-between',
                                    alignItems: isMobile ? 'center' : 'flex-start',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    gap: isMobile ? '8px' : '0'
                                }}>
                                    <span style={{ textAlign: isMobile ? 'center' : 'left' }}>Tax ({taxRate}%)</span>
                                    <span style={{ textAlign: isMobile ? 'center' : 'right' }}>${calculateTax().toFixed(2)}</span>
                                </div>
                            )}
                            {discountType && discountValue && (
                                <div className="sbm-summary-row sbm-discount" style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: isMobile ? 'center' : 'space-between',
                                    alignItems: isMobile ? 'center' : 'flex-start',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    gap: isMobile ? '8px' : '0'
                                }}>
                                    <span style={{ textAlign: isMobile ? 'center' : 'left' }}>
                                        Discount ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`})
                                    </span>
                                    <span style={{ 
                                        color: '#dc2626',
                                        textAlign: isMobile ? 'center' : 'right'
                                    }}>
                                        -${calculateDiscount().toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="sbm-summary-row sbm-total" style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                justifyContent: isMobile ? 'center' : 'space-between',
                                alignItems: isMobile ? 'center' : 'flex-start',
                                padding: '12px 0 0 0',
                                fontSize: isMobile ? '18px' : '16px',
                                fontWeight: '700',
                                color: '#059669',
                                borderTop: '2px solid #e5e7eb',
                                marginTop: '8px',
                                gap: isMobile ? '8px' : '0'
                            }}>
                                <span style={{ textAlign: isMobile ? 'center' : 'left' }}>Total Amount:</span>
                                <span style={{ textAlign: isMobile ? 'center' : 'right' }}>${calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Message Section */}
                        <div className="sbm-discount-label tw-mt-4">Message</div>
                        <ReactQuill
                            className="sbm-quill"
                            theme="snow"
                            value={bidDescription}
                            onChange={handleBidDescriptionChange}
                            modules={{ toolbar: [] }}
                        />
                        {/* Validation Error Display */}
                        {bidDescriptionError && (
                            <div style={{
                                marginTop: '12px',
                                padding: '12px 16px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                color: '#dc2626',
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '16px' }}>⚠️</span>
                                    <div style={{ whiteSpace: 'pre-line' }}>
                                        {bidDescriptionError}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Bottom Buttons */}
                        <div className="sbm-btn-row" style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: isMobile ? '12px' : '16px',
                            marginTop: '24px'
                        }}>
                            <button 
                                type="button"
                                onClick={onClose}
                                className="sbm-btn sbm-btn-close"
                                style={{
                                    width: isMobile ? '100%' : 'auto',
                                    padding: isMobile ? '14px 20px' : '12px 24px',
                                    fontSize: isMobile ? '16px' : '14px'
                                }}
                            >
                                Close
                            </button>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="sbm-btn sbm-btn-submit"
                                style={{
                                    width: isMobile ? '100%' : 'auto',
                                    padding: isMobile ? '14px 20px' : '12px 24px',
                                    fontSize: isMobile ? '16px' : '14px'
                                }}
                            >
                                {isLoading ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update Bid' : 'Submit')}
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
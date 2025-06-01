import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Alert, Badge, Accordion } from 'react-bootstrap';
import './UnviewedBids.css';

function UncontactedBusinesses() {
    const [uncontactedBusinesses, setUncontactedBusinesses] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchUncontactedBusinesses();
    }, [selectedCategory]);

    const fetchUncontactedBusinesses = async () => {
        try {
            setLoading(true);
            setError('');

            // Get all open requests from all service tables
            const [
                { data: photographyRequests, error: photoError },
                { data: videographyRequests, error: videoError },
                { data: djRequests, error: djError },
                { data: cateringRequests, error: cateringError },
                { data: beautyRequests, error: beautyError },
                { data: floristRequests, error: floristError },
                { data: planningRequests, error: planningError },
                { data: generalRequests, error: generalError }
            ] = await Promise.all([
                supabaseAdmin
                    .from('photography_requests')
                    .select('id, created_at, event_title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('videography_requests')
                    .select('id, created_at, event_title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('dj_requests')
                    .select('id, created_at, title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('catering_requests')
                    .select('id, created_at, title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('beauty_requests')
                    .select('id, created_at, event_title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('florist_requests')
                    .select('id, created_at, event_title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('wedding_planning_requests')
                    .select('id, created_at, event_title, event_type, status')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('requests')
                    .select('id, created_at, event_title, service_category, open')
                    .eq('open', true)
                    .order('created_at', { ascending: false })
            ]);

            // Check for errors
            if (photoError) throw photoError;
            if (videoError) throw videoError;
            if (djError) throw djError;
            if (cateringError) throw cateringError;
            if (beautyError) throw beautyError;
            if (floristError) throw floristError;
            if (planningError) throw planningError;
            if (generalError) throw generalError;

            // Combine all requests with their service categories
            const allRequests = [
                ...(photographyRequests || []).map(req => ({ ...req, service_category: 'photography' })),
                ...(videographyRequests || []).map(req => ({ ...req, service_category: 'videography' })),
                ...(djRequests || []).map(req => ({ ...req, service_category: 'dj', event_title: req.title })),
                ...(cateringRequests || []).map(req => ({ ...req, service_category: 'catering', event_title: req.title })),
                ...(beautyRequests || []).map(req => ({ ...req, service_category: 'beauty' })),
                ...(floristRequests || []).map(req => ({ ...req, service_category: 'florist' })),
                ...(planningRequests || []).map(req => ({ ...req, service_category: 'wedding_planning' })),
                ...(generalRequests || []).map(req => ({ ...req, event_type: req.service_category }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Get all businesses
            const { data: businesses, error: businessesError } = await supabaseAdmin
                .from('business_profiles')
                .select('id, business_name, phone, business_category');

            if (businessesError) throw businessesError;

            // Get all bids
            const { data: bids, error: bidsError } = await supabaseAdmin
                .from('bids')
                .select('user_id, request_id');

            if (bidsError) throw bidsError;

            // Get all request views
            const { data: requestViews, error: viewsError } = await supabaseAdmin
                .from('request_views')
                .select('business_id, request_id');

            if (viewsError) throw viewsError;

            // Create a map of businesses that have bid on each request
            const requestBidsMap = {};
            bids.forEach(bid => {
                if (!requestBidsMap[bid.request_id]) {
                    requestBidsMap[bid.request_id] = new Set();
                }
                requestBidsMap[bid.request_id].add(bid.user_id);
            });

            // Create a map of businesses that have viewed each request
            const requestViewsMap = {};
            requestViews.forEach(view => {
                if (!requestViewsMap[view.request_id]) {
                    requestViewsMap[view.request_id] = new Set();
                }
                requestViewsMap[view.request_id].add(view.business_id);
            });

            // Organize businesses by request
            const businessesByRequest = {};
            allRequests.forEach(request => {
                // Filter businesses that haven't bid on this request and match the request's category
                const uncontacted = businesses.filter(business => {
                    // Skip businesses without phone numbers
                    if (!business.phone) return false;

                    // Get business categories as an array
                    const businessCategories = Array.isArray(business.business_category) 
                        ? business.business_category 
                        : [business.business_category];

                    // Check if business category matches request category
                    if (!businessCategories.includes(request.service_category)) {
                        return false;
                    }

                    // If global category filter is set, check against it
                    if (selectedCategory !== 'all' && !businessCategories.includes(selectedCategory)) {
                        return false;
                    }

                    // Check if business has bid on this request
                    if (requestBidsMap[request.id]?.has(business.id)) {
                        return false;
                    }

                    // Check if business has viewed this request
                    if (requestViewsMap[request.id]?.has(business.id)) {
                        return false;
                    }

                    return true;
                });

                if (uncontacted.length > 0) {
                    businessesByRequest[request.id] = {
                        request: request,
                        businesses: uncontacted
                    };
                }
            });

            setUncontactedBusinesses(businessesByRequest);
        } catch (err) {
            setError(`Error fetching uncontacted businesses: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendSMS = (business, request) => {
        // Format phone number - remove any non-numeric characters
        const formattedPhone = business.phone.replace(/\D/g, '');
        
        // If there's no phone number, show an alert
        if (!formattedPhone) {
            alert('No phone number available for this business');
            return;
        }
        
        // Generate message template with request details
        const message = `You have a new ${request.service_category} request to view on Bidi! Click here to view: https://savewithbidi.com/submit-bid/${request.id}`;
        
        // Create the sms link
        const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
        
        // Open the link
        window.open(smsLink, '_blank');
    };

    const handleRefresh = () => {
        fetchUncontactedBusinesses();
    };

    if (loading) return <div>Loading uncontacted businesses...</div>;

    // Calculate total number of uncontacted businesses
    const totalUncontacted = Object.values(uncontactedBusinesses).reduce(
        (total, { businesses }) => total + businesses.length, 
        0
    );

    return (
        <div className="unviewed-bids-container">
            <div className="header-actions">
                <h3 className="section-title">
                    Businesses Without Bids
                    <Badge bg="danger" className="count-badge">
                        {totalUncontacted}
                    </Badge>
                </h3>
                <div className="filter-section">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="category-select"
                    >
                        <option value="all">All Categories</option>
                        <option value="photography">Photography</option>
                        <option value="videography">Videography</option>
                        <option value="dj">DJ</option>
                        <option value="catering">Catering</option>
                        <option value="beauty">Beauty</option>
                        <option value="florist">Florist</option>
                        <option value="wedding_planning">Wedding Planning</option>
                    </select>
                    <button 
                        className="refresh-button" 
                        onClick={handleRefresh}
                    >
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            <p className="section-description">
                These businesses have not bid on recent requests matching their service category.
            </p>
            
            {successMessage && <Alert variant="success" className="mobile-alert">{successMessage}</Alert>}
            {error && <Alert variant="danger" className="mobile-alert">{error}</Alert>}
            
            {Object.keys(uncontactedBusinesses).length === 0 && !loading && (
                <div className="alert alert-info mobile-alert">
                    No uncontacted businesses found.
                </div>
            )}
            
            <Accordion className="requests-accordion">
                {Object.entries(uncontactedBusinesses).map(([requestId, { request, businesses }], index) => (
                    <Accordion.Item key={requestId} eventKey={index.toString()}>
                        <Accordion.Header>
                            <div className="request-header-content">
                                <div className="request-title-section">
                                    <h4 className="request-title">
                                        {request.event_title || `${request.service_category} Request`}
                                    </h4>
                                    <Badge bg="info" className="request-badge">
                                        {request.service_category}
                                    </Badge>
                                </div>
                                <div className="request-meta">
                                    <small className="request-date">
                                        <i className="far fa-clock icon-space"></i>
                                        {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                    <Badge bg="secondary" className="business-count">
                                        {businesses.length} businesses
                                    </Badge>
                                </div>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body>
                            <div className="businesses-list">
                                {businesses.map(business => (
                                    <div className="customer-card" key={business.id}>
                                        <div className="customer-header">
                                            <h5 className="customer-email">{business.business_name}</h5>
                                            <Badge bg="primary" className="bid-count">
                                                {Array.isArray(business.business_category) 
                                                    ? business.business_category.join(', ') 
                                                    : business.business_category}
                                            </Badge>
                                        </div>
                                        <div className="customer-body">
                                            <div className="customer-info">
                                                <h6 className="info-title">Business Contact:</h6>
                                                <p className="contact-detail"><strong>Phone:</strong> {business.phone}</p>
                                            </div>
                                            <div className="action-buttons">
                                                <button 
                                                    className="sms-button"
                                                    onClick={() => handleSendSMS(business, request)}
                                                    disabled={!business.phone}
                                                >
                                                    <i className="fas fa-sms icon-space"></i> Send Text
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>
        </div>
    );
}

export default UncontactedBusinesses; 
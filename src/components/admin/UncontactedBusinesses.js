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
                    .select('id, created_at, event_title, event_type, status, price_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('videography_requests')
                    .select('id, created_at, event_title, event_type, status, price_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('dj_requests')
                    .select('id, created_at, title, event_type, status, budget_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('catering_requests')
                    .select('id, created_at, title, event_type, status, budget_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('beauty_requests')
                    .select('id, created_at, event_title, event_type, status, price_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('florist_requests')
                    .select('id, created_at, event_title, event_type, status, price_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('wedding_planning_requests')
                    .select('id, created_at, event_title, event_type, status, budget_range')
                    .in('status', ['open', 'pending'])
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('requests')
                    .select('id, created_at, event_title, service_category, open, price_range')
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
                ...(photographyRequests || []).map(req => ({ ...req, service_category: 'photography', budget: req.price_range })),
                ...(videographyRequests || []).map(req => ({ ...req, service_category: 'videography', budget: req.price_range })),
                ...(djRequests || []).map(req => ({ ...req, service_category: 'dj', event_title: req.title, budget: req.budget_range })),
                ...(cateringRequests || []).map(req => ({ ...req, service_category: 'catering', event_title: req.title, budget: req.budget_range })),
                ...(beautyRequests || []).map(req => ({ ...req, service_category: 'beauty', budget: req.price_range })),
                ...(floristRequests || []).map(req => ({ ...req, service_category: 'florist', budget: req.price_range })),
                ...(planningRequests || []).map(req => ({ ...req, service_category: 'wedding_planning', budget: req.budget_range })),
                ...(generalRequests || []).map(req => ({ ...req, event_type: req.service_category, budget: req.price_range }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Get all businesses
            const { data: businesses, error: businessesError } = await supabaseAdmin
                .from('business_profiles')
                .select('id, business_name, phone, business_category, notification_preferences');

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
            let totalBusinessesFiltered = 0;
            let totalBusinessesWithNoTextNotifications = 0;
            let totalBusinessesBelowBudget = 0;
            
            allRequests.forEach(request => {
                // Debug: Log the request being processed
                console.log(`Processing request: ${request.id} (${request.service_category})`);
                
                // Filter businesses that haven't bid on this request and match the request's category
                const uncontacted = businesses.filter(business => {
                    // Skip businesses without phone numbers
                    if (!business.phone) {
                        console.log(`Business ${business.business_name} skipped: no phone number`);
                        return false;
                    }

                    // Get business categories as an array
                    const businessCategories = Array.isArray(business.business_category) 
                        ? business.business_category 
                        : [business.business_category];

                    // Check if business category matches request category
                    if (!businessCategories.includes(request.service_category)) {
                        console.log(`Business ${business.business_name} skipped: category mismatch (${businessCategories.join(', ')} vs ${request.service_category})`);
                        return false;
                    }

                    // If global category filter is set, check against it
                    if (selectedCategory !== 'all' && !businessCategories.includes(selectedCategory)) {
                        console.log(`Business ${business.business_name} skipped: global category mismatch (${businessCategories.join(', ')} vs ${selectedCategory})`);
                        return false;
                    }

                    // Check if business has bid on this request
                    if (requestBidsMap[request.id]?.has(business.id)) {
                        console.log(`Business ${business.business_name} skipped: already bid on this request`);
                        return false;
                    }

                    // Check if business has viewed this request
                    if (requestViewsMap[request.id]?.has(business.id)) {
                        console.log(`Business ${business.business_name} skipped: already viewed this request`);
                        return false;
                    }

                    // Check text notification preferences
                    const preferences = business.notification_preferences || {};
                    // Default to true if no preferences are set (new businesses or businesses that haven't set preferences yet)
                    const textNotifications = preferences.textNotifications !== false; // Default to true if not specified
                    const notifyOnNewRequests = preferences.notifyOnNewRequests !== false; // Default to true if not specified
                    
                    // Debug: Log preferences for businesses being filtered
                    if (preferences.textNotifications === false || preferences.notifyOnNewRequests === false) {
                        console.log(`Business ${business.business_name} has explicit preferences:`, preferences);
                    }
                    
                    // If business doesn't want text notifications or new request notifications, skip them
                    if (!textNotifications || !notifyOnNewRequests) {
                        totalBusinessesWithNoTextNotifications++;
                        console.log(`Business ${business.business_name} skipped: no text notifications enabled (preferences: ${JSON.stringify(preferences)})`);
                        return false;
                    }

                    // Check minimum budget requirement if set
                    const minimumBudget = preferences.minimumBudgetForNotifications || 0;
                    if (minimumBudget > 0) {
                        // Extract budget amount from request
                        let budgetAmount = 0;
                        const budgetField = request.budget;
                        
                        if (budgetField) {
                            if (typeof budgetField === 'string') {
                                // Handle string format like "$500 - $1000" or "$500"
                                const budgetMatch = budgetField.toString().match(/\$?(\d+)/);
                                if (budgetMatch) {
                                    budgetAmount = parseInt(budgetMatch[1]);
                                }
                            } else if (typeof budgetField === 'object' && budgetField?.type === 'custom') {
                                // Handle custom budget object
                                budgetAmount = budgetField.min || 0;
                            }
                        }
                        
                        // If we have a budget amount and it's below minimum, skip this business
                        if (budgetAmount > 0 && budgetAmount < minimumBudget) {
                            totalBusinessesBelowBudget++;
                            console.log(`Business ${business.business_name} skipped: below minimum budget (${budgetAmount} < ${minimumBudget})`);
                            return false;
                        }
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

            // Log filtering statistics
            console.log(`UncontactedBusinesses filtering results:`);
            console.log(`- Total businesses with no text notifications: ${totalBusinessesWithNoTextNotifications}`);
            console.log(`- Total businesses below budget requirements: ${totalBusinessesBelowBudget}`);
            console.log(`- Total businesses filtered out: ${totalBusinessesWithNoTextNotifications + totalBusinessesBelowBudget}`);
            console.log(`- Final uncontacted businesses: ${Object.values(businessesByRequest).reduce((total, { businesses }) => total + businesses.length, 0)}`);

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
        const message = `You have a new ${request.service_category} request to view on Bidi! Click here to view: https://bidievents.com/business-dashboard`;
        
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
            
            {/* Add filtering summary */}
            <div className="filtering-summary" style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #dee2e6'
            }}>
                <h6 style={{ marginBottom: '10px', color: '#495057' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                    Text Notification Filtering
                </h6>
                <p style={{ marginBottom: '8px', fontSize: '14px', color: '#6c757d' }}>
                    Businesses are only shown if they:
                </p>
                <ul style={{ marginBottom: '0', fontSize: '14px', color: '#6c757d', paddingLeft: '20px' }}>
                    <li>Have text notifications enabled</li>
                    <li>Have new request notifications enabled</li>
                    <li>Meet minimum budget requirements (if set)</li>
                    <li>Have a valid phone number</li>
                </ul>
            </div>
            
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
                                    {request.budget && (
                                        <Badge bg="info" className="budget-badge" style={{ marginLeft: '8px' }}>
                                            <i className="fas fa-dollar-sign icon-space"></i>
                                            {typeof request.budget === 'string' ? request.budget : 
                                             request.budget?.type === 'custom' ? `$${request.budget.min} - $${request.budget.max}` : 
                                             'Budget set'}
                                        </Badge>
                                    )}
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
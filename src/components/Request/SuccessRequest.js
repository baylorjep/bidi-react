import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function SuccessRequest() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [requestData, setRequestData] = useState({});

    useEffect(() => {
        if (location.state) {
            console.log('Raw location state:', location.state);
            const categories = [];
            const requestData = {};

            // First check if we have selectedCategories array
            if (location.state.selectedCategories && Array.isArray(location.state.selectedCategories)) {
                location.state.selectedCategories.forEach(category => {
                    switch(category) {
                        case 'Photography':
                            categories.push({ id: 'photography', name: 'Photography', table: 'photography_requests' });
                            requestData.photography = location.state.photographyId;
                            break;
                        case 'Videography':
                            categories.push({ id: 'videography', name: 'Videography', table: 'videography_requests' });
                            requestData.videography = location.state.videographyId;
                            break;
                        case 'Catering':
                            categories.push({ id: 'catering', name: 'Catering', table: 'catering_requests' });
                            requestData.catering = location.state.cateringId;
                            break;
                        case 'DJ':
                            categories.push({ id: 'dj', name: 'DJ', table: 'dj_requests' });
                            requestData.dj = location.state.djId;
                            break;
                        case 'Florist':
                            categories.push({ id: 'florist', name: 'Florist', table: 'florist_requests' });
                            requestData.florist = location.state.floristId;
                            break;
                        case 'Hair and Makeup':
                        case 'hair and makeup':  // Add lowercase variation
                        case 'beauty':           // Add direct beauty match
                        case 'HairAndMakeup':  // Add this case
                            categories.push({ id: 'beauty', name: 'Hair and Makeup', table: 'beauty_requests' });
                            requestData.beauty = location.state.beautyId;
                            console.log('Processing beauty request:', { 
                                id: requestData.beauty,
                                category,
                                beautyId: location.state.beautyId 
                            });
                            break;
                        case 'Wedding Planning':
                        case 'weddingplanning':
                        case 'WeddingPlanning':  // Add this case to match the exact string
                            categories.push({ id: 'weddingplanning', name: 'Wedding Planning', table: 'wedding_planning_requests' });
                            requestData.weddingplanning = location.state.weddingPlanningId;
                            console.log('Processing wedding planning request:', { 
                                id: requestData.weddingplanning,
                                category,
                                weddingPlanningId: location.state.weddingPlanningId 
                            });
                            break;
                    }
                });
            } else {
                // Fallback to checking individual IDs
                if (location.state.photographyId) {
                    categories.push({ id: 'photography', name: 'Photography', table: 'photography_requests' });
                    requestData.photography = location.state.photographyId;
                }
                if (location.state.videographyId) {
                    categories.push({ id: 'videography', name: 'Videography', table: 'videography_requests' });
                    requestData.videography = location.state.videographyId;
                }
                if (location.state.cateringId) {
                    categories.push({ id: 'catering', name: 'Catering', table: 'catering_requests' });
                    requestData.catering = location.state.cateringId;
                }
                if (location.state.djId) {
                    categories.push({ id: 'dj', name: 'DJ', table: 'dj_requests' });
                    requestData.dj = location.state.djId;
                }
                if (location.state.floristId) {
                    categories.push({ id: 'florist', name: 'Florist', table: 'florist_requests' });
                    requestData.florist = location.state.floristId;
                }
                if (location.state.beautyId) {
                    categories.push({ id: 'beauty', name: 'Hair and Makeup', table: 'beauty_requests' });
                    requestData.beauty = location.state.beautyId;
                    console.log('Found beauty ID in fallback:', location.state.beautyId);
                }
                if (location.state.weddingPlanningId) {
                    categories.push({ id: 'weddingplanning', name: 'Wedding Planning', table: 'wedding_planning_requests' });
                    requestData.weddingplanning = location.state.weddingPlanningId;
                }
            }

            // Add debug logging
            console.log('Location state:', location.state);
            console.log('Processed categories:', categories);
            console.log('Processed request data:', requestData);
            setSelectedCategories(categories);
            setRequestData(requestData);
        } else {
            console.log('No location state found');
        }
    }, [location.state]);

    const handleVendorSelection = (category) => {
        console.log('Navigating to vendor selection for:', category);
        const currentIndex = selectedCategories.findIndex(cat => cat.id === category.id);
        const remainingCategories = selectedCategories.slice(currentIndex);
        
        // Simplified key mapping
        const requestDataKey = category.id;  // Use category.id directly since we normalized it above

        console.log('Beauty selection check:', {
            categoryId: category.id,
            requestId: requestData[requestDataKey],
            table: category.table
        });

        navigate(`/vendor-selection/${category.id}`, {
            state: {
                requestId: requestData[requestDataKey],
                table: category.table,
                categories: remainingCategories,
                requestData: requestData
            }
        });
    };

    const handleSkipVendorSelection = () => {
        navigate('/bids');
    };

    return (
        <div className="success-container" style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '40px 20px',
            textAlign: 'center'
        }}>
            <div className="success-icon" style={{
                fontSize: 64,
                color: '#9633eb',
                marginBottom: 24
            }}>✓</div>

            <h1 style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#9633eb',
                marginBottom: 16
            }}>
                Request Submitted Successfully!
            </h1>

            <div style={{
                background: '#f8f9fa',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '32px',
                maxWidth: '600px',
                margin: '0 auto 32px'
            }}>
                <h2 style={{
                    fontSize: '20px',
                    color: '#333',
                    marginBottom: '16px',
                    fontWeight: '600'
                }}>
                    What happens next?
                </h2>
                <p style={{
                    fontSize: '16px',
                    color: '#666',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                    textAlign: 'left'
                }}>
                    You have two options:
                </p>
                <ul style={{
                    textAlign: 'left',
                    color: '#666',
                    paddingLeft: '20px',
                    marginBottom: '16px'
                }}>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Browse Vendors Now:</strong> Select specific vendors below and request bids from them directly
                    </li>
                    <li>
                        <strong>Wait for Bids:</strong> Skip vendor selection and let vendors come to you with their best offers
                    </li>
                </ul>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 32
            }}>
                {selectedCategories.map((category) => (
                    <div key={category.id} style={{
                        background: '#f8f9fa',
                        padding: '20px',
                        borderRadius: 12,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                background: '#9633eb',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 20
                            }}>
                                {category.name.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: '#333',
                                    margin: 0
                                }}>
                                    {category.name}
                                </h3>
                            </div>
                                                    <button
                            onClick={() => handleVendorSelection(category)}
                            style={{
                                background: '#9633eb',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: 8,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#7a29bc'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#9633eb'}
                        >
                            Browse Vendors
                        </button>
                        </div>

                    </div>
                ))}
            </div>

            <button
                onClick={handleSkipVendorSelection}
                style={{
                    background: '#fff',
                    color: '#9633eb',
                    border: '2px solid #9633eb',
                    padding: '16px 32px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = '#9633eb';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#9633eb';
                }}
            >
                Wait for Bids
            </button>
        </div>
    );
}

export default SuccessRequest;
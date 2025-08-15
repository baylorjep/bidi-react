import React, { useState, useEffect } from 'react';
import '../../App.css';
import '../../styles/RequestDisplayMini.css';
import { supabase } from '../../supabaseClient';

function RequestDisplayMini({ 
    request, 
    hideBidButton, 
    isPhotoRequest = false, 
    onHide, 
    isHidden = false, 
    onShow,
    currentVendorId = null,
    onMessageClick = null,
    onViewMore = null,
    isClientRequested = false,
    hasSubmittedBid = false,
    requestUrgency = null,
    budgetMatch = null,
    locationMatch = null,
    serviceMatch = null
}) {
    // Debug: Log the request object to see what we're receiving
    // console.log('RequestDisplayMini received request:', {
    //     id: request.id,
    //     bid_count: request.bid_count,
    //     bid_count_type: typeof request.bid_count,
    //     title: request.event_title || request.title
    // });
    const [timeLeft, setTimeLeft] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    
    // Mobile responsive state
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);

    // Function to mark request as seen
    const markRequestAsSeen = async () => {
        if (!currentVendorId || !request) return;

        try {
            // Determine the table name for this request
            let tableName = request.table_name;
            if (!tableName) {
                const category = (request.service_category || '').toLowerCase();
                switch (category) {
                    case 'photography': tableName = 'photography_requests'; break;
                    case 'videography': tableName = 'videography_requests'; break;
                    case 'dj': tableName = 'dj_requests'; break;
                    case 'catering': tableName = 'catering_requests'; break;
                    case 'beauty': tableName = 'beauty_requests'; break;
                    case 'florist': tableName = 'florist_requests'; break;
                    case 'wedding planning': tableName = 'wedding_planning_requests'; break;
                    default: tableName = 'requests';
                }
            }

            // Check if this vendor has already seen this request
            const hasSeen = Array.isArray(request.has_seen) && request.has_seen.includes(currentVendorId);
            if (hasSeen) return; // Already seen

            // Update the has_seen field in the database
            const { error } = await supabase
                .from(tableName)
                .update({ 
                    has_seen: supabase.sql`COALESCE(has_seen, '[]'::jsonb) || '["${currentVendorId}"]'::jsonb` 
                })
                .eq('id', request.id);

            if (error) {
                console.error('Error marking request as seen:', error);
            } else {
                // Update local state to reflect that the request has been seen
                request.has_seen = Array.isArray(request.has_seen) 
                    ? [...request.has_seen, currentVendorId]
                    : [currentVendorId];
            }
        } catch (error) {
            console.error('Error marking request as seen:', error);
        }
    };

    // Mark request as seen when component mounts (when request is displayed)
    useEffect(() => {
        if (currentVendorId && request) {
            markRequestAsSeen();
        }
    }, [currentVendorId, request]);

    // Helper to parse created_at as UTC if needed
    const parseUTCDate = (dateString) => {
        if (!dateString) return null;
        if (dateString.includes('T')) return new Date(dateString);
        return new Date(dateString.replace(' ', 'T').replace(/([.\d]+)$/, '$1Z'));
    };

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = parseUTCDate(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;
        const now = Date.now();
        const created = parseUTCDate(createdAt)?.getTime();
        if (!created) return null;
        const minutesSinceCreation = (now - created) / (1000 * 60);

        if (minutesSinceCreation < 30) {
            return {
                message: "Save 2%",
                endTime: new Date(created + (30 * 60 * 1000))
            };
        }
        if (minutesSinceCreation < 60) {
            return {
                message: "Save 1%",
                endTime: new Date(created + (60 * 60 * 1000))
            };
        }
        return null;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const promotion = checkPromotion(request.created_at);
            if (promotion && promotion.endTime) {
                const nowUTC = Date.now();
                const createdUTC = parseUTCDate(request.created_at)?.getTime();
                if (!createdUTC) {
                    setTimeLeft('');
                    return;
                }
                const timeRemaining = promotion.endTime.getTime() - nowUTC;
                const minutesSinceCreation = (nowUTC - createdUTC) / (1000 * 60);

                if (promotion.message === "Save 2%" && minutesSinceCreation < 0) {
                    setTimeLeft("30:00");
                } else if (promotion.message === "Save 1%" && minutesSinceCreation < 0) {
                    setTimeLeft("60:00");
                } else if (timeRemaining > 0) {
                    const totalSeconds = Math.floor(timeRemaining / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                } else {
                    setTimeLeft('');
                }
            } else {
                setTimeLeft('');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [request.created_at]);

    // Handle window resize for mobile responsiveness
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            setIsSmallMobile(window.innerWidth <= 480);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    const getTitle = () => {
        if (isPhotoRequest) {
            return request.event_title || 'Untitled Event';
        }
        const title = request.event_title || 
                     request.title || 
                     request.service_title || 
                     `${request.event_type || 'Untitled'} Event`;
        if (title.length < 3 && request.event_type) {
            return `${request.event_type} Event`;
        }
        return title;
    };

    function parseLocalDate(dateString) {
      if (!dateString || typeof dateString !== 'string') return null;
      if (dateString.includes('T')) {
        const d = new Date(dateString);
        return isNaN(d) ? null : d;
      }
      const datePart = dateString.split(' ')[0];
      const [year, month, day] = datePart.split('-');
      if (!year || !month || !day) {
        console.warn('parseLocalDate: Malformed date string:', dateString);
        return null;
      }
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return isNaN(d) ? null : d;
    }

    const getDate = () => {
        if (request.table_name === 'beauty_requests') {
            const parsed = parseLocalDate(request.start_date);
            return parsed ? parsed.toLocaleDateString() : 'Date not specified';
        }

        const startDate = isPhotoRequest 
            ? request.start_date 
            : request.service_date || request.date || request.event_date || request.start_date;

        if (request.date_flexibility === 'specific') {
            const parsed = parseLocalDate(startDate);
            return parsed ? parsed.toLocaleDateString() : 'Date not specified';
        } else if (request.date_flexibility === 'range') {
            const endDate = request.end_date || request.event_end_date;
            const parsedStart = parseLocalDate(startDate);
            const parsedEnd = parseLocalDate(endDate);
            return parsedStart && parsedEnd 
                ? `${parsedStart.toLocaleDateString()} - ${parsedEnd.toLocaleDateString()}`
                : parsedStart 
                    ? parsedStart.toLocaleDateString()
                    : 'Date not specified';
        } else if (request.date_flexibility === 'flexible') {
            return `Flexible within ${request.date_timeframe || request.timeframe || 'specified timeframe'}`;
        }
        const parsed = parseLocalDate(startDate);
        return parsed ? parsed.toLocaleDateString() : 'Date not specified';
    };

    const isVendorSelected = () => {
        if (!request.vendor_id || !currentVendorId) return false;
        const vendorIds = Array.isArray(request.vendor_id) 
            ? request.vendor_id 
            : JSON.parse(request.vendor_id || '[]');
        return vendorIds.includes(currentVendorId);
    };

    // Get bid opportunity score (0-100)

    const getCategoryIcon = (category) => {
        const iconMap = {
            'photography': 'fa-solid fa-camera',
            'videography': 'fa-solid fa-video',
            'dj': 'fa-solid fa-music',
            'catering': 'fa-solid fa-utensils',
            'beauty': 'fa-solid fa-spa',
            'florist': 'fa-solid fa-leaf',
            'wedding_planning': 'fa-solid fa-ring',
            'regular': 'fa-solid fa-star'
        };
        return iconMap[category] || iconMap.regular;
    };

    return (
        <>
            <style>
                {`
                    .request-row {
                        -webkit-tap-highlight-color: transparent;
                        -webkit-touch-callout: none;
                        -webkit-user-select: none;
                        -khtml-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        user-select: none;
                    }
                    
                    @media (max-width: 768px) {
                        .request-row {
                            transition: transform 0.1s ease;
                        }
                        .request-row:active {
                            transform: scale(0.98);
                        }
                    }
                `}
            </style>
            <div className="request-row" style={{
            background: 'white',
            borderRadius: isSmallMobile ? '6px' : '8px',
            border: hasSubmittedBid ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            position: 'relative',
            cursor: 'pointer',
            marginBottom: isSmallMobile ? '6px' : '8px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            padding: isMobile ? '12px 15px' : '16px 20px',
            minHeight: isMobile ? 'auto' : '80px',
            gap: isMobile ? '12px' : '0'
        }}
        data-request-id={request.id}
        onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.backgroundColor = 'white';
        }}
        onClick={() => {
            // Mark request as seen when clicked
            markRequestAsSeen();
            onViewMore && onViewMore(request.id);
        }}
        >
            {/* Row Layout */}
            
            {/* Icon and Title Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '12px' : '16px',
                flex: isMobile ? 'none' : '0 0 280px',
                minWidth: isMobile ? 'auto' : '280px',
                width: isMobile ? '100%' : '280px'
            }}>
                <div style={{
                    width: isSmallMobile ? '36px' : '40px',
                    height: isSmallMobile ? '36px' : '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #a328f4 0%, #ff008a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: isSmallMobile ? '14px' : '16px',
                    flexShrink: 0
                }}>
                            <i className={getCategoryIcon(request.service_category || request.type)}></i>
                        </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: isSmallMobile ? '15px' : '16px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        wordWrap: 'break-word'
                    }}>
                        {getTitle()}
                    </div>
                    <div style={{
                        fontSize: isSmallMobile ? '13px' : '14px',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                        marginBottom: '2px',
                        lineHeight: '1.2',
                        wordWrap: 'break-word'
                    }}>
                        {request.event_type || request.service_category || 'Service Request'}
                    </div>
                </div>
                    </div>
                    
{/* Info Section - Responsive Layout */}
            {isMobile ? (
                /* Mobile: Stacked compact info */
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flex: '1',
                            minWidth: '0'
                        }}>
                            <i className="fas fa-calendar" style={{ color: '#6b7280', fontSize: '12px' }}></i>
                            <span style={{
                                fontSize: '13px',
                                color: '#374151',
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                lineHeight: '1.2'
                            }}>
                                {getDate()}
                            </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flex: '1',
                            minWidth: '0'
                        }}>
                            <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
                            <span style={{
                                fontSize: '13px',
                                color: '#374151',
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                lineHeight: '1.2'
                            }}>
                                {request.price_range || request.budget_range || 'TBD'}
                            </span>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <i className="fas fa-map-marker-alt" style={{ color: '#6b7280', fontSize: '12px' }}></i>
                        <span style={{
                            fontSize: '13px',
                            color: '#374151',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            lineHeight: '1.2'
                        }}>
                            {request.location || 'TBD'}
                        </span>
                    </div>
                </div>
            ) : (
                /* Desktop: Horizontal layout with fixed widths */
                <>
                    {/* Date Section */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: '0 0 160px',
                        minWidth: '160px',
                        maxWidth: '160px',
                        padding: '0 16px'
                    }}>
                        <i className="fas fa-calendar" style={{ color: '#6b7280', fontSize: '14px' }}></i>
                        <div style={{
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: '500',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            lineHeight: '1.2',
                            overflow: 'hidden'
                        }}>
                            {getDate()}
                        </div>
                    </div>

                    {/* Location Section */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: '0 0 140px',
                        minWidth: '140px',
                        maxWidth: '140px',
                        padding: '0 16px'
                    }}>
                        <i className="fas fa-map-marker-alt" style={{ color: '#6b7280', fontSize: '14px' }}></i>
                        <div style={{
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            lineHeight: '1.2'
                        }}>
                            {request.location || 'TBD'}
                        </div>
                    </div>

                    {/* Budget Section */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: '0 0 140px',
                        minWidth: '140px',
                        maxWidth: '140px',
                        padding: '0 16px'
                    }}>
                        <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '14px' }}></i>
                        <div style={{
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: '500',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            lineHeight: '1.2',
                            overflow: 'hidden'
                        }}>
                            {request.price_range || request.budget_range || 'TBD'}
                        </div>
                    </div>
                </>
            )}

            {/* Status Badges */}
            <div style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: '4px',
                flexWrap: 'wrap',
                flex: isMobile ? 'none' : '0 0 140px',
                minWidth: isMobile ? 'auto' : '140px',
                maxWidth: isMobile ? 'auto' : '140px',
                padding: isMobile ? '0' : '0 16px',
                width: isMobile ? '100%' : '140px'
            }}>
                {isNew(request.created_at) && (
                    <div style={{
                        background: 'linear-gradient(135deg, #ff008a 0%, #ec4899 100%)',
                        color: 'white',
                        padding: isSmallMobile ? '2px 6px' : '3px 8px',
                        borderRadius: isSmallMobile ? '8px' : '12px',
                        fontSize: isSmallMobile ? '9px' : '10px',
                        fontWeight: '600'
                    }}>
                        NEW
                    </div>
                )}
                {checkPromotion(request.created_at) && (
                    <div style={{
                        background: '#f59e0b',
                        color: 'white',
                        padding: isSmallMobile ? '2px 6px' : '3px 8px',
                        borderRadius: isSmallMobile ? '8px' : '12px',
                        fontSize: isSmallMobile ? '9px' : '10px',
                        fontWeight: '600'
                    }}>
                        {checkPromotion(request.created_at).message}
                    </div>
                )}
                {isClientRequested && (
                    <div style={{
                        background: '#fef3c7',
                        color: '#d97706',
                        padding: isSmallMobile ? '2px 6px' : '3px 8px',
                        borderRadius: isSmallMobile ? '8px' : '12px',
                        fontSize: isSmallMobile ? '9px' : '10px',
                        fontWeight: '600'
                    }}>
                        REQUESTED
                    </div>
                )}
                {requestUrgency === 'urgent' && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: isSmallMobile ? '2px 6px' : '3px 8px',
                        borderRadius: isSmallMobile ? '8px' : '12px',
                        fontSize: isSmallMobile ? '9px' : '10px',
                        fontWeight: '600'
                    }}>
                        URGENT
                    </div>
                )}
                {serviceMatch === 'perfect' && (
                    <div style={{
                        background: '#d1fae5',
                        color: '#059669',
                        padding: isSmallMobile ? '2px 6px' : '3px 8px',
                        borderRadius: isSmallMobile ? '8px' : '12px',
                        fontSize: isSmallMobile ? '9px' : '10px',
                        fontWeight: '600'
                    }}>
                        PERFECT
                    </div>
                )}
                {budgetMatch === 'high' && (
                    <div style={{
                        background: '#fde7fa',
                        color: '#f247d1',
                        padding: isSmallMobile ? '2px 6px' : '3px 8px',
                        borderRadius: isSmallMobile ? '8px' : '12px',
                        fontSize: isSmallMobile ? '9px' : '10px',
                        fontWeight: '600'
                    }}>
                        HIGH $
                    </div>
                )}
                </div>

            {/* Actions Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '6px' : '8px',
                flex: isMobile ? 'none' : '0 0 180px',
                minWidth: isMobile ? 'auto' : '180px',
                maxWidth: isMobile ? 'auto' : '180px',
                justifyContent: isMobile ? 'center' : 'flex-end',
                width: isMobile ? '100%' : '180px'
            }}>
                <button 
                    style={{
                        background: hasSubmittedBid ? '#a328f4' : '#ff008a',
                        color: 'white',
                        border: 'none',
                        padding: isSmallMobile ? '6px 12px' : '8px 16px',
                        borderRadius: '6px',
                        fontSize: isSmallMobile ? '12px' : '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        touchAction: 'manipulation',
                        flex: isMobile ? '1' : 'none'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Mark request as seen when button is clicked
                        markRequestAsSeen();
                        onViewMore && onViewMore(request.id);
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                    {hasSubmittedBid ? 'View Bid' : 'View Details'}
                    </button>
                    
                {isClientRequested && (
                    <button 
                        style={{
                            background: '#a328f4',
                            color: 'white',
                            border: 'none',
                            padding: isSmallMobile ? '6px 10px' : '8px 12px',
                            borderRadius: '6px',
                            fontSize: isSmallMobile ? '12px' : '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            touchAction: 'manipulation'
                        }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMessageClick && onMessageClick(request.user_id);
                            }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                                Message
                        </button>
                    )}
                
                {/* Hide/Show button - only show on desktop in actions section */}
                {!isMobile && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            isHidden ? onShow() : onHide();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '4px',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            minWidth: '36px',
                            minHeight: '36px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        {isHidden ? '👁️' : '✕'}
                    </button>
                )}
            </div>

            {/* Mobile Hide/Show button - positioned in top right corner */}
            {isMobile && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        isHidden ? onShow() : onHide();
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #e5e7eb',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        touchAction: 'manipulation',
                        minWidth: '32px',
                        minHeight: '32px',
                        zIndex: 20,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(243, 244, 246, 0.9)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                >
                    {isHidden ? '👁️' : '✕'}
                </button>
            )}

            {/* Submitted bid indicator for row layout */}
            {hasSubmittedBid && (
                <div style={{
                    position: 'absolute',
                    top: isSmallMobile ? '6px' : '8px',
                    left: isSmallMobile ? '6px' : '8px',
                    background: '#3b82f6',
                    color: 'white',
                    padding: isSmallMobile ? '1px 4px' : '2px 6px',
                    borderRadius: isSmallMobile ? '6px' : '8px',
                    fontSize: isSmallMobile ? '9px' : '10px',
                    fontWeight: '600',
                    zIndex: 10
                }}>
                    💼 {isSmallMobile ? '' : 'BID'}
                </div>
            )}

            {selectedPhoto && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content">
                        <img 
                            src={selectedPhoto.url} 
                            onClick={(e) => e.stopPropagation()} 
                            alt="Selected" 
                        />
                    </div>
                </div>
            )}
            </div>
        </>
    );
}

export default RequestDisplayMini;

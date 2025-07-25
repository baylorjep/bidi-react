import React, { useState, useEffect } from 'react';
import '../../App.css';
import '../../styles/RequestDisplayMini.css';

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
    const [timeLeft, setTimeLeft] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

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
        <div className="request-card" style={{
            background: 'white',
            borderRadius: '16px',
            border: hasSubmittedBid ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            position: 'relative',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        }}
        onClick={() => onViewMore && onViewMore(request.id)}
        >
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                padding: '16px 20px',
                borderRadius: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #a328f4 0%, #ff008a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                        }}>
                            <i className={getCategoryIcon(request.service_category || request.type)}></i>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '4px'
                            }}>
                                {getTitle()}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#6b7280'
                            }}>
                                {request.event_type || request.service_category || 'Service Request'}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {isNew(request.created_at) && (
                            <div style={{
                                background: 'linear-gradient(135deg, #ff008a 0%, #ec4899 100%)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                NEW
                            </div>
                        )}
                        {checkPromotion(request.created_at) && (
                            <div style={{
                                background: '#f59e0b',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                {checkPromotion(request.created_at).message}
                                {timeLeft && <span> ({timeLeft})</span>}
                            </div>
                        )}
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
                                padding: '4px',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                        >
                            {isHidden ? '👁️' : '✕'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div style={{ padding: '20px' }}>


                {/* Key indicators */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    flexWrap: 'wrap'
                }}>
                    {/* Competition indicator */}


                    {/* Client requested */}
                    {isClientRequested && (
                        <div style={{
                            background: '#fef3c7',
                            color: '#d97706',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Client Requested
                        </div>
                    )}

                    {/* Urgency */}
                    {requestUrgency === 'urgent' && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                            </svg>
                            Urgent
                        </div>
                    )}

                    {/* Perfect match */}
                    {serviceMatch === 'perfect' && (
                        <div style={{
                            background: '#d1fae5',
                            color: '#059669',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Perfect Match
                        </div>
                    )}

                    {/* High budget */}
                    {budgetMatch === 'high' && (
                        <div style={{
                            background: '#fde7fa', // lighter background to go with the text
                            color: '#f247d1',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                            </svg>
                            High Budget
                        </div>
                    )}
                </div>

                {/* Event details with big icons */}
                <div style={{
                    background: '#f9fafb',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '12px'
                    }}>
                        Event Details
                    </div>
                                        <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '16px',
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #a328f4 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px'
                            }}>
                                <i className="fas fa-calendar"></i>
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                textAlign: 'center'
                            }}>
                                Date
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                textAlign: 'center'
                            }}>
                                {getDate()}
                            </div>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '16px',
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ff008a 0%, #ec4899 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px'
                            }}>
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                textAlign: 'center'
                            }}>
                                Location
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                textAlign: 'center'
                            }}>
                                {request.location || 'TBD'}
                            </div>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '16px',
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #c026d3 0%, #a855f7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px'
                            }}>
                                <i className="fas fa-dollar-sign"></i>
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                textAlign: 'center'
                            }}>
                                Budget
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                textAlign: 'center'
                            }}>
                                {request.price_range || request.budget_range}
                            </div>
                        </div>
                        
                        {request.description && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '16px',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px'
                                }}>
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    textAlign: 'center'
                                }}>
                                    Description
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    textAlign: 'center'
                                }}>
                                    {request.description.length > 50 
                                        ? request.description.substring(0, 50) + '...' 
                                        : request.description}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center'
                }}>
                    <button 
                        style={{
                            background: hasSubmittedBid ? '#a328f4' : '#ff008a',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            flex: 1,
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        {hasSubmittedBid ? 'View My Bid' : 'View Details'}
                    </button>
                    
                    {isClientRequested && (
                        <button 
                            style={{
                                background: '#a328f4',
                                color: 'white',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMessageClick && onMessageClick(request.user_id);
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >

                                Message
                        </button>
                    )}
                </div>
            </div>

            {/* Submitted bid indicator */}
            {hasSubmittedBid && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    zIndex: 10
                }}>
                    💼 Bid Submitted
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
    );
}

export default RequestDisplayMini;

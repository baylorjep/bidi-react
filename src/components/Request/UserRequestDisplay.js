import React from 'react';
import '../../styles/UserRequestDisplay.css';

function UserRequestDisplay({ request }) {
    const getRequestTitle = () => {
        switch (request.type) {
            case 'regular':
                return request.service_title || 'Untitled Request';
            case 'photography':
            case 'videography':
                return request.event_title || 'Untitled Event';
            case 'dj':
                return `DJ Request for ${request.event_type || 'Event'}`;
            case 'catering':
                return `Catering for ${request.event_type || 'Event'}`;
            case 'beauty':
                return `Beauty Services for ${request.event_type || 'Event'}`;
            case 'florist':
                return `Floral Services for ${request.event_type || 'Event'}`;
            default:
                return 'Untitled Request';
        }
    };

    const getDateDisplay = (request) => {
        if (request.date_flexibility === 'specific') {
            return request.start_date ? new Date(request.start_date).toLocaleDateString() : 'Not specified';
        } else if (request.date_flexibility === 'range') {
            return `${request.start_date ? new Date(request.start_date).toLocaleDateString() : 'Not specified'} - ${request.end_date ? new Date(request.end_date).toLocaleDateString() : 'Not specified'}`;
        } else if (request.date_flexibility === 'flexible') {
            switch (request.date_timeframe) {
                case '3months':
                    return 'Within 3 months';
                case '6months':
                    return 'Within 6 months';
                case '1year':
                    return 'Within 1 year';
                case 'more':
                    return 'More than 1 year';
                default:
                    return 'Flexible';
            }
        }
        return 'Not specified';
    };

    const getRequestDetails = () => {
        switch (request.type) {
            case 'regular':
                return [
                    { label: 'Service Type', value: request.service_type },
                    { label: 'Date', value: request.service_date ? new Date(request.service_date).toLocaleDateString() : 'Not specified' },
                    { label: 'Location', value: request.location || 'Not specified' },
                    { label: 'Budget', value: request.price_range || 'Not specified' }
                ];
            case 'photography':
            case 'videography':
                return [
                    { label: 'Event Type', value: request.event_type },
                    { label: 'Date', value: getDateDisplay(request) },
                    { label: 'Location', value: request.location || 'Not specified' },
                    { label: 'Budget', value: request.price_range || 'Not specified' },
                    { label: 'Duration', value: request.duration ? `${request.duration} hours` : 'Not specified' },
                    { label: 'Number of People', value: request.num_people || 'Not specified' }
                ];
            case 'dj':
                return [
                    { label: 'Event Type', value: request.event_type },
                    { label: 'Date', value: getDateDisplay(request) },
                    { label: 'Duration', value: request.event_duration ? `${request.event_duration} hours` : 'Not specified' },
                    { label: 'Budget', value: request.budget_range || 'Not specified' }
                ];
            case 'catering':
                return [
                    { label: 'Event Type', value: request.event_type },
                    { label: 'Date', value: getDateDisplay(request) },
                    { label: 'Location', value: request.location || 'Not specified' },
                    { label: 'Budget', value: request.budget_range || 'Not specified' },
                    { label: 'Number of People', value: request.estimated_guests || 'Not specified' },
                    { label: 'Service Type', value: request.food_service_type || 'Not specified' }
                ];
            case 'beauty':
                return [
                    { label: 'Event Type', value: request.event_type },
                    { label: 'Date', value: getDateDisplay(request) },
                    { label: 'Service Type', value: request.service_type || 'Not specified' },
                    { label: 'Location', value: request.location || 'Not specified' }
                ];
            case 'florist':
                return [
                    { label: 'Event Type', value: request.event_type },
                    { label: 'Date', value: getDateDisplay(request) },
                    { label: 'Location', value: request.location || 'Not specified' },
                    { label: 'Budget', value: request.price_range || 'Not specified' }
                ];
            default:
                return [];
        }
    };

    return (
        <div className="user-request-container">
            <div className="request-status-badge" 
                 style={{ 
                     backgroundColor: request.status === 'open' || request.status === 'pending' ? 
                                    '#ff3da6' : '#808080'
                 }}>
                {request.status === 'pending' ? 'OPEN' : request.status.toUpperCase()}
            </div>
            
            <div className="request-content">
                <h3 className="request-title">{getRequestTitle()}</h3>
                
                <div className="request-details-grid">
                    {getRequestDetails().map((detail, index) => (
                        <div key={index} className="detail-item">
                            <span className="detail-item-label">{detail.label}</span>
                            <span className="detail-item-value">{detail.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserRequestDisplay; 
import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

function PhotoRequestDisplay({ photoRequest, hideBidButton }) {
    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{photoRequest.event_title}</h2>
                
                <p className="request-type"><strong>Event Type:</strong> {photoRequest.event_type}</p>
                {/* <p className="request-date-type"><strong>Date Type:</strong> {photoRequest.date_type}</p> */}

                <p className="request-start-date">
                    <strong>{photoRequest.date_type === 'range' ? 'Start Date: ' : 'Date: '}</strong> 
                    {new Date(photoRequest.start_date).toLocaleDateString()}
                </p>

                {photoRequest.date_type === 'range' && (
                    <p className="request-end-date"><strong>End Date:</strong> {new Date(photoRequest.end_date).toLocaleDateString()}</p>
                )}

                <p className="request-time-of-day"><strong>Time of Day:</strong> {photoRequest.time_of_day}</p>
                <p className="request-location"><strong>Location:</strong> {photoRequest.location}</p>
                <p className="request-num-people"><strong>Number of People:</strong> {photoRequest.num_people}</p>
                <p className="request-duration"><strong>Duration (in hours):</strong> {photoRequest.duration}</p>
                <p className="request-indoor-outdoor"><strong>Indoor/Outdoor:</strong> {photoRequest.indoor_outdoor}</p>
                
                {photoRequest.additional_comments && (
                    <p className="request-comments"><strong>Additional Comments:</strong> {photoRequest.additional_comments}</p>
                )}

                {photoRequest.extras && Object.keys(photoRequest.extras).length > 0 && (
                    <div className="request-extras">
                        <strong>Extras:</strong>
                        <ul>
                            {Object.entries(photoRequest.extras).map(([key, value]) => (
                                <li key={key}>{key}: {value.toString()}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {!hideBidButton && (
                    <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${photoRequest.id}`}>
                        <span className="bid-button-text">
                            <span>Bid</span>
                        </span>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default PhotoRequestDisplay;

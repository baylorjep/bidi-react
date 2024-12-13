import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import scrollBtn from '../../assets/images/Icons/scroll button.png';
import '../../App.css';

function PhotoRequestDisplay({ photoRequest, hideBidButton }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Add debugging log
    useEffect(() => {
        console.log("PhotoRequest photos:", photoRequest.photos);
    }, [photoRequest]);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % photoRequest.photos.length);
    };

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? photoRequest.photos.length - 1 : prevIndex - 1
        );
    };

    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{photoRequest.event_title}</h2>
                
                <p className="request-type"><strong>Event Type:</strong> {photoRequest.event_type}</p>

                <p className="request-start-date">
                    <strong>{photoRequest.date_type === 'range' ? 'Start Date: ' : 'Date: '}</strong> 
                    {new Date(photoRequest.start_date).toLocaleDateString()}
                </p>

                {photoRequest.date_type === 'range' && (
                    <p className="request-end-date"><strong>End Date:</strong> {new Date(photoRequest.end_date).toLocaleDateString()}</p>
                )}

                <p className="request-time-of-day"><strong>Time of Day:</strong> {photoRequest.time_of_day}</p>
                <p className="request-type"><strong>Location:</strong> {photoRequest.location}</p>
                <p className="request-num-people"><strong>Number of People:</strong> {photoRequest.num_people}</p>
                <p className="request-duration"><strong>Duration (in hours):</strong> {photoRequest.duration}</p>
                <p className="request-indoor-outdoor"><strong>Indoor/Outdoor:</strong> {photoRequest.indoor_outdoor}</p>
                
                {photoRequest.additional_comments && (
                    <p className="request-type"><strong>Additional Comments:</strong> {photoRequest.additional_comments}</p>
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

                {photoRequest.photos && photoRequest.photos.length > 0 ? (
                    <>
                        <p className="request-indoor-outdoor">
                            <strong>Inspiration Photos: </strong>
                        </p>
                        <div className="photo-preview-container">
                            <div className="photo-carousel">
                                <button
                                    className="carousel-arrow left-arrow"
                                    onClick={handlePrevious}
                                    disabled={photoRequest.photos.length <= 1}
                                >
                                    <img src={scrollBtn} alt="Left Arrow" />
                                </button>

                                <div className="photo-container">
                                <img
                                    src={photoRequest.photos[currentIndex].url} // Ensure this matches the URL property from your data
                                    className="photo"
                                    alt={`Photo ${currentIndex + 1}`} // Simplified alt text
                                    onError={(e) => {
                                        console.error('Image failed to load:', photoRequest.photos[currentIndex]);
                                        e.target.alt = 'Failed to load image';
                                    }}
                                />
                                </div>

                                <button
                                    className="carousel-arrow right-arrow"
                                    onClick={handleNext}
                                    disabled={photoRequest.photos.length <= 1}
                                >
                                    <img src={scrollBtn} alt="Right Arrow" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : null}
                
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

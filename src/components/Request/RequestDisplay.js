import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../App.css';
import { supabase } from '../../supabaseClient';

function RequestDisplay({ request, servicePhotos, hideBidButton }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    const getPublicUrl = (filePath) => {
        try {
            const { data } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error getting public URL:', error);
            return null;
        }
    };

    const getTimeDifference = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays < 7) return 'New';
        return `${diffInDays}d ago`;
    };

    const getServiceDateDistance = (serviceDate) => {
        const now = new Date();
        const service = new Date(serviceDate);
        const diffInDays = Math.floor((service - now) / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 0) return 'Past event';
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Tomorrow';
        return `In ${diffInDays} days`;
    };

    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{request.service_title}</h2>
                <div className="request-status">
                    {getServiceDateDistance(request.service_date)}
                </div>
                
                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">Location</span>
                        <span className="detail-value-long">{request.location}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value-long">{request.service_category}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Date of Service</span>
                        <span className="detail-value-long">{new Date(request.service_date).toLocaleDateString()}</span>
                    </div>
                </div>
    
                <div className="request-description">
                    <span className="detail-label">Description</span>
                    <div className="detail-value-long">{request.service_description}</div>
                </div>

                {servicePhotos && servicePhotos.length > 0 ? (
                    <>
                        <div className="request-subtype">
                            Service Photos
                        </div>
                        <div className="photo-grid scroll-container">
                            {servicePhotos.map((photo, index) => {
                                const publicUrl = getPublicUrl(photo.file_path);
                                return (
                                    <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
                                        <img
                                            src={publicUrl || photo.photo_url}
                                            className="photo"
                                            alt={`Photo ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/150?text=Image+Failed';
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : null}
                
                {request.additional_comments && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '20px'}}>
                        <div className="request-subtype">Additional Comments</div>
                        <div className="request-info">
                            <ReactQuill 
                                value={request.additional_comments}
                                readOnly={true}
                                theme="snow"
                                modules={{ toolbar: false }}
                            />
                        </div>
                    </div>
                )}
                


                {selectedPhoto && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content">
                            <img src={selectedPhoto.photo_url} onClick={(e) => e.stopPropagation()} alt="Selected" />
                        </div>
                    </div>
                )}
                
                {!hideBidButton && (
                    <div style={{marginTop: '20px'}}>
                        <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${request.id}`}>
                            <span className="bid-button-text">
                                <span>View More</span>
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RequestDisplay;

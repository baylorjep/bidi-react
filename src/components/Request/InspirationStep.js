import React, { useState } from 'react';
import { Spinner } from 'react-bootstrap';

const PhotoGrid = ({ photos, removePhoto, openModal }) => {
    return (
        <div className="photo-grid">
            {photos.map((photo, index) => (
                <div key={index} className="photo-grid-item">
                    <img src={photo.url} alt={`Uploaded ${index}`} className="photo-grid-image" onClick={() => openModal(photo)} />
                    <button className="remove-photo-button" onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                    }}>X</button>
                </div>
            ))}
        </div>
    );
};

const PhotoModal = ({ photo, onClose }) => {
    if (!photo) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
                <button 
                    className="remove-photo-button" 
                    style={{ position: 'absolute', right: '10px', top: '10px' }}
                    onClick={onClose}
                >
                    X
                </button>
                <img src={photo.url} alt="Full size" />
            </div>
        </div>
    );
};

const InspirationStep = ({ 
    photos = [], 
    pinterestBoard = '', 
    onPhotosChange, 
    onPinterestChange,
    error = null
}) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [addMoreLoading, setAddMoreLoading] = useState(false);

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        // Validate file types
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            console.error("Please only upload image files (JPEG, PNG, GIF, WEBP)");
            return;
        }
        
        setLoading(true);
        setAddMoreLoading(true);
        
        try {
            const newPhotos = files.map(file => ({
                file: file,
                url: URL.createObjectURL(file),
                name: file.name,
                type: file.type
            }));
            
            onPhotosChange([...photos, ...newPhotos]);
            
        } catch (err) {
            console.error("Error processing files:", err);
        } finally {
            setLoading(false);
            setAddMoreLoading(false);
        }
    };

    const handleRemovePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
    };

    return (
        <div className="photo-upload-section">
            <div className="photo-preview-container">
                {photos.length === 0 ? (
                    <div
                        className="photo-upload-box"
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            type="file"
                            id="file-input"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="54" height="45" viewBox="0 0 54 45" fill="none">
                            <path d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915" stroke="#141B34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727" stroke="#141B34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="photo-upload-text">Drag & Drop to Upload or Click to Browse</div>
                    </div>
                ) : (
                    <>
                        <PhotoGrid 
                            photos={photos}
                            removePhoto={handleRemovePhoto}
                            openModal={(photo) => {
                                setSelectedPhoto(photo);
                                setIsPhotoModalOpen(true);
                            }}
                        />
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button 
                                onClick={() => document.getElementById('file-input-more').click()}
                                className="add-more-photos-btn"
                            >
                                <input
                                    type="file"
                                    id="file-input-more"
                                    multiple
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <span className='add-more-text'>Add More Photos</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
            {isPhotoModalOpen && (
                <PhotoModal 
                    photo={selectedPhoto} 
                    onClose={() => {
                        setSelectedPhoto(null);
                        setIsPhotoModalOpen(false);
                    }} 
                />
            )}
            <div className="custom-input-container" style={{ marginTop: '20px' }}>
                <input
                    type="url"
                    name="pinterestBoard"
                    value={pinterestBoard}
                    onChange={(e) => onPinterestChange(e.target.value)}
                    placeholder="Paste your Pinterest board link here"
                    className="custom-input"
                />
                <label htmlFor="pinterestBoard" className="custom-label">
                    Pinterest Board Link
                </label>
            </div>
            {error && (
                <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default InspirationStep; 
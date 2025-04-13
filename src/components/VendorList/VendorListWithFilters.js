import React, { useCallback } from 'react';
import { ImageErrorBoundary } from 'react-image-error';
import { LoadingPlaceholder } from '../../components/LoadingPlaceholder';

const VendorListWithFilters = () => {
    const preloadImage = useCallback(async (src) => {
        if (isVideo(src) || mediaErrors[src]) {
            return Promise.resolve();
        }

        try {
            // First convert HEIC if needed
            const heicConvertedSrc = await convertHeicToJpeg(src);
            // Then convert to WebP
            const webpSrc = await convertToWebP(heicConvertedSrc);
            
            return new Promise((resolve) => {
                const img = new Image();
                
                img.onload = () => {
                    setMediaErrors(prev => ({
                        ...prev,
                        [src]: false
                    }));
                    resolve();
                };
                
                img.onerror = () => {
                    console.warn(`Failed to load image: ${src}`);
                    setMediaErrors(prev => ({
                        ...prev,
                        [src]: true
                    }));
                    resolve();
                };
                
                img.src = webpSrc;
            });
        } catch (error) {
            console.error('Error loading image:', error);
            return Promise.resolve();
        }
    }, [mediaErrors]);

    const renderImage = (item, index, vendorId) => {
        const imageId = `${vendorId}-${index}`;
        const itemIsVideo = isVideo(item);

        return (
            <div key={index} style={{ height: '100%' }}>
                <div className="image-container" 
                     style={{ 
                         height: '100%',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         background: '#f5f5f5'
                     }}
                     onClick={() => openModal(item)}
                >
                    {itemIsVideo ? (
                        <div className="video-container">
                            <video
                                src={item}
                                className="portfolio-image video"
                                muted
                                loop
                                playsInline
                                loading="lazy"
                                preload="metadata"
                                onError={(e) => {
                                    console.warn(`Failed to load video: ${item}`);
                                    setMediaErrors(prev => ({
                                        ...prev,
                                        [item]: true
                                    }));
                                }}
                            />
                            {!mediaErrors[item] && (
                                <div className="video-play-overlay">
                                    <button 
                                        className="play-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            try {
                                                const container = e.currentTarget.closest('.video-container');
                                                const video = container?.querySelector('video');
                                                const overlay = e.currentTarget.closest('.video-play-overlay');
                                                
                                                if (!video || !overlay) return;

                                                // Pause all other videos
                                                document.querySelectorAll('.portfolio-image.video').forEach(v => {
                                                    if (v !== video) {
                                                        v.pause();
                                                        const otherOverlay = v.parentElement?.querySelector('.video-play-overlay');
                                                        if (otherOverlay) {
                                                            otherOverlay.style.display = 'flex';
                                                        }
                                                    }
                                                });
                                                
                                                if (video.paused) {
                                                    video.play()
                                                        .then(() => {
                                                            overlay.style.display = 'none';
                                                        })
                                                        .catch(error => {
                                                            console.warn('Error playing video:', error);
                                                        });
                                                } else {
                                                    video.pause();
                                                    overlay.style.display = 'flex';
                                                }
                                            } catch (error) {
                                                console.warn('Error handling play button click:', error);
                                            }
                                        }}
                                    >
                                        ▶
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <ImageErrorBoundary>
                            {imageLoading[imageId] ? (
                                <LoadingPlaceholder 
                                    width="100%"
                                    height="100%"
                                    className="portfolio-image"
                                />
                            ) : (
                                <img
                                    src={convertedUrls[item] || item}
                                    alt={`Portfolio ${index}`}
                                    className={`portfolio-image ${imageLoading[imageId] ? 'loading' : 'loaded'}`}
                                    loading="lazy"
                                    onLoad={() => handleImageLoad(imageId)}
                                    onError={(e) => {
                                        console.warn(`Failed to load image: ${item}`);
                                        setMediaErrors(prev => ({
                                            ...prev,
                                            [item]: true
                                        }));
                                    }}
                                    style={{
                                        opacity: imageLoading[imageId] || convertingImages[item] ? 0.5 : 1,
                                        transition: 'opacity 0.3s ease-in-out'
                                    }}
                                />
                            )}
                        </ImageErrorBoundary>
                    )}
                    {convertingImages[item] && (
                        <div className="converting-overlay">
                            <div className="converting-spinner"></div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Render your images here */}
        </div>
    );
};

export default VendorListWithFilters; 
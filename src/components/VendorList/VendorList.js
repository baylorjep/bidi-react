import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { supabase } from '../../supabaseClient';
import '../../styles/VendorList.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Verified from '../../assets/Frame 1162.svg';
import StarIcon from '../../assets/star-duotone.svg'; // Assuming you have a star icon

const VendorList = ({ 
    selectedCategory, 
    sortOrder, 
    preferredLocation, 
    categoryType, 
    currentPage, 
    vendorsPerPage, 
    setCurrentPage,
    setTotalCount,
    preferredType 
}) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMedia, setModalMedia] = useState(null);
    const [expandedStories, setExpandedStories] = useState({});
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    const [imageLoading, setImageLoading] = useState({});
    const [totalCount, setTotalCountState] = useState(0);
    const [mediaErrors, setMediaErrors] = useState({});
    const navigate = useNavigate();

    const truncateText = (text, maxLength = 150) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substr(0, text.substr(0, maxLength).lastIndexOf(' ')) + '...';
    };

    const toggleStory = (vendorId) => {
        setExpandedStories(prev => ({
            ...prev,
            [vendorId]: !prev[vendorId]
        }));
    };

    const toggleDescription = (vendorId) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [vendorId]: !prev[vendorId]
        }));
    };

    const isVideo = (url) => {
        return url.match(/\.(mp4|mov|wmv|avi|mkv)$/i);
    };

    const preloadImage = useCallback((src) => {
        // Skip if not a valid image URL or already failed
        if (isVideo(src) || mediaErrors[src]) {
            return Promise.resolve();
        }

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
            
            img.src = src;
        });
    }, [mediaErrors]);

    const handleImageLoad = useCallback((imageId) => {
        setImageLoading(prev => ({
            ...prev,
            [imageId]: false
        }));
    }, []);

    useEffect(() => {
        const fetchVendors = async () => {
            setLoading(true);
            
            // Get all vendors in the category without pagination
            let query = supabase
                .from('business_profiles')
                .select('*')
                .or('stripe_account_id.not.is.null,Bidi_Plus.eq.true');

            if (selectedCategory) {
                query = query.eq('business_category', selectedCategory);
            }

            // Get all vendors first
            const { data: allVendorData, error: vendorError } = await query;

            if (vendorError) {
                console.error('Error fetching vendors:', vendorError);
                setLoading(false);
                return;
            }

            // Set total count
            setTotalCount(allVendorData.length);
            setTotalCountState(allVendorData.length);

            // Get all photos for all vendors
            const { data: photoData, error: photoError } = await supabase
                .from('profile_photos')
                .select('*')
                .in('user_id', allVendorData.map(vendor => vendor.id));

            if (photoError) {
                console.error('Error fetching photos:', photoError);
                setLoading(false);
                return;
            }

            // Process all vendors with their photos
            const allVendorsWithPhotos = await Promise.all(allVendorData.map(async vendor => {
                const vendorPhotos = photoData?.filter(photo => photo.user_id === vendor.id) || [];
                const profilePhoto = vendorPhotos.find(photo => photo.photo_type === 'profile');
                const portfolioMedia = vendorPhotos.filter(photo => 
                    photo.photo_type === 'portfolio' || photo.photo_type === 'video'
                );
                const videoCount = vendorPhotos.filter(photo => photo.photo_type === 'video').length;

                const { data: reviewData } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('vendor_id', vendor.id);

                const averageRating = reviewData?.length > 0
                    ? (reviewData.reduce((acc, review) => acc + review.rating, 0) / reviewData.length).toFixed(1)
                    : null;

                const locationScore = preferredLocation && vendor.business_address
                    ? vendor.business_address.toLowerCase().includes(preferredLocation.replace(/-/g, ' ').toLowerCase())
                        ? 1 : 0
                    : 0;

                const typeScore = preferredType && vendor.specializations
                    ? vendor.specializations.includes(preferredType)
                        ? 1 : 0
                    : 0;

                return {
                    ...vendor,
                    profile_photo_url: profilePhoto?.photo_url || '/images/default.jpg',
                    portfolio_photos: portfolioMedia.map(media => media.photo_url),
                    photo_count: vendorPhotos.length,
                    video_count: videoCount,
                    average_rating: averageRating,
                    locationScore,
                    typeScore
                };
            }));

            // Sort all vendors
            const sortedVendors = sortVendors(allVendorsWithPhotos);

            // Then paginate the sorted results
            const startIndex = (currentPage - 1) * vendorsPerPage;
            const endIndex = startIndex + vendorsPerPage;
            const paginatedVendors = sortedVendors.slice(startIndex, endIndex);

            setVendors(paginatedVendors);
            setLoading(false);
        };

        fetchVendors();
    }, [selectedCategory, sortOrder, currentPage, vendorsPerPage]);

    const sortVendors = (vendors) => {
        // Log vendors and their counts before sorting
        console.log('Vendors before sorting:', vendors.map(v => ({
            id: v.id,
            name: v.business_name,
            photos: v.photo_count,
            videos: v.video_count,
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true
        })));

        const sorted = [...vendors].sort((a, b) => {
            const aIsVerified = a.membership_tier === 'Verified' || a.Bidi_Plus === true;
            const bIsVerified = b.membership_tier === 'Verified' || b.Bidi_Plus === true;
            const aHasPhotos = a.photo_count > 0;
            const bHasPhotos = b.photo_count > 0;
            const aHasVideos = a.video_count > 0;
            const bHasVideos = b.video_count > 0;

            // First priority: Verification status
            if (aIsVerified !== bIsVerified) {
                return aIsVerified ? -1 : 1;
            }

            // Second priority: Has videos (within verification groups)
            if (aHasVideos !== bHasVideos) {
                return aHasVideos ? -1 : 1;
            }

            // Third priority: Has photos (within video groups)
            if (aHasPhotos !== bHasPhotos) {
                return aHasPhotos ? -1 : 1;
            }

            // Fourth priority: Total media count (photos + videos)
            const aTotalMedia = a.photo_count + (a.video_count * 2); // Weight videos more
            const bTotalMedia = b.photo_count + (b.video_count * 2);
            if (aTotalMedia !== bTotalMedia) {
                return bTotalMedia - aTotalMedia;
            }

            // Finally, apply the selected sort order
            switch (sortOrder) {
                case 'rating':
                    return (b.average_rating || 0) - (a.average_rating || 0);
                case 'base_price_low':
                    return (a.minimum_price || 0) - (b.minimum_price || 0);
                case 'base_price_high':
                    return (b.minimum_price || 0) - (a.minimum_price || 0);
                default:
                    return 0;
            }
        });

        // Log vendors after sorting
        console.log('Vendors after sorting:', sorted.map(v => ({
            id: v.id,
            name: v.business_name,
            photos: v.photo_count,
            videos: v.video_count,
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true
        })));

        return sorted;
    };

    const totalPages = Math.ceil(totalCount / vendorsPerPage);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo(0, 0);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const settings = {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        afterChange: (currentSlide) => {
            // Pause all videos when sliding
            const videos = document.querySelectorAll('.portfolio-image.video');
            videos.forEach(video => {
                video.pause();
                // Reset overlay display
                const overlay = video.parentElement?.querySelector('.video-play-overlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }
            });
        },
        // Add these settings to ensure proper slider behavior
        accessibility: true,
        draggable: true,
        swipe: true,
        touchMove: true,
        waitForAnimate: true
    };

    function SampleNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <button
                type="button"
                className={`${className} custom-arrow custom-next-arrow`}
                onClick={onClick}
                style={{ 
                    ...style, 
                    display: 'flex', 
                    width: '40px', 
                    height: '40px', 
                    justifyContent: 'center',   
                    alignItems: 'center', 
                    gap: '8px', 
                    flexShrink: 0, 
                    borderRadius: '40px', 
                    background: 'var(--White-15, rgba(255, 255, 255, 0.15))', 
                    backdropFilter: 'blur(14px)', 
                    position: 'absolute', 
                    top: '50%', 
                    right: '10px', 
                    transform: 'translateY(-50%)',
                    border: 'none',
                    cursor: 'pointer'
                }}
            />
        );
    }

    function SamplePrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <button
                type="button"
                className={`${className} custom-arrow custom-prev-arrow`}
                onClick={onClick}
                style={{ 
                    ...style, 
                    display: 'flex', 
                    width: '40px', 
                    height: '40px', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px', 
                    flexShrink: 0, 
                    borderRadius: '40px', 
                    background: 'var(--White-15, rgba(255, 255, 255, 0.15))', 
                    backdropFilter: 'blur(14px)', 
                    position: 'absolute', 
                    top: '50%', 
                    left: '10px', 
                    transform: 'translateY(-50%)',
                    zIndex: '10',
                    border: 'none',
                    cursor: 'pointer'
                }}
            />
        );
    }

    const openModal = (media) => {
        const isVideoFile = isVideo(media);
        setModalMedia({
            url: media,
            type: isVideoFile ? 'video' : 'image'
        });
        setModalOpen(true);
        
        // Pause all playing videos in the carousel when opening modal
        document.querySelectorAll('.portfolio-image.video').forEach(video => {
            video.pause();
            const overlay = video.parentElement?.querySelector('.video-play-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        });
    };

    const closeModal = () => {
        // If current modal content is video, pause it
        const modalVideo = document.querySelector('.modal-content.video');
        if (modalVideo) {
            modalVideo.pause();
        }
        setModalOpen(false);
        setModalMedia(null);
    };

    const handleCheckClick = (event) => {
        const tooltip = event.currentTarget.querySelector('.verified-tooltip');
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
        tooltip.style.zIndex = '1000'; // Ensure the tooltip is on top
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
            tooltip.style.zIndex = '1'; // Reset z-index
        }, 3000);
    };

    const handleGetQuote = (vendor) => {
        const vendorData = {
            vendor,
            image: vendor.profile_photo_url
        };

        if (vendor.business_category === 'photography') {
            navigate('/request/photography', { state: vendorData });
        } else if (vendor.business_category === 'dj') {
            navigate('/request/dj', { state: vendorData });
        } else if (vendor.business_category === 'florist') {
            navigate('/request/florist', { state: vendorData });
        } else if (vendor.business_category === 'catering') {
            navigate('/request/catering', { state: vendorData });
        } else if (vendor.business_category === 'videography') {
            navigate('/request/videography', { state: vendorData });
        }
        else if (vendor.business_category === 'beauty') {
            navigate('/request/beauty', { state: vendorData });
        }
    };

    const handleMoreInfo = (vendor) => {
        navigate(`/portfolio/${vendor.id}`);
    };

    return (
        <div className="vendor-list">
            {vendors.map(vendor => (
                <div key={vendor.id} className="vendor-card">
                    <div className="portfolio-images">
                        {vendor.portfolio_photos.length > 0 ? (
                            <Slider {...settings}>
                                {vendor.portfolio_photos.map((item, index) => {
                                    const imageId = `${vendor.id}-${index}`;
                                    const itemIsVideo = isVideo(item);

                                    return (
                                        <div key={index}>
                                            {itemIsVideo ? (
                                                <div className="video-container"
                                                    onClick={(e) => {
                                                        // Only open modal if not clicking play button
                                                        if (!e.target.closest('.play-button')) {
                                                            openModal(item);
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        try {
                                                            const video = e.currentTarget.querySelector('video');
                                                            const overlay = e.currentTarget.querySelector('.video-play-overlay');
                                                            if (video && overlay && !video.paused) {
                                                                overlay.style.display = 'none';
                                                            }
                                                        } catch (error) {
                                                            console.warn('Error handling mouse enter:', error);
                                                        }
                                                    }}
                                                >
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
                                                <div className="image-container" onClick={() => openModal(item)}>
                                                    {imageLoading[imageId] && !mediaErrors[item] && (
                                                        <div className="image-placeholder">
                                                            Loading...
                                                        </div>
                                                    )}
                                                    {mediaErrors[item] ? (
                                                        <div className="media-error">
                                                            Unable to load media
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={item}
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
                                                                opacity: imageLoading[imageId] ? 0 : 1,
                                                                transition: 'opacity 0.3s ease-in-out'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </Slider>
                        ) : (
                            <img 
                                src="/images/default.jpg" 
                                alt="No portfolio available" 
                                className="portfolio-image"
                                loading="lazy"
                            />
                        )}
                    </div>
                    <div className="vendor-info">
                        <div className="vendor-header">
                            <img src={vendor.profile_photo_url} alt={vendor.business_name} className="vendor-profile-image" onError={(e) => { e.target.src = '/images/default.jpg'; }} />
                            <div style={{display:'flex', flexDirection:'row', justifyContent:'center', alignItems:'left', marginLeft:'12px'}}>
                            <h2 className="vendor-name">
                                {vendor.business_name}
                            </h2>

                            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'left'}}>
                                {(vendor.membership_tier === 'Verified' || vendor.Bidi_Plus) && (
                                    <div className="verified-check-container" onClick={handleCheckClick}>
                                        <img style={{marginLeft:'4px', marginBottom:'4px'}} src={Verified} alt="Verified" />
                                        <span className="verified-tooltip">
                                            This business is verified by Bidi. You will have a 100% money back guarantee if you pay through Bidi.
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'left'}}>
                                {vendor.average_rating && (
                                    <span className="vendor-rating">
                                        <img src={StarIcon} alt="Star" className="star-icon" />
                                        {vendor.average_rating}
                                    </span>
                                )}
                            </div>
                            </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', minHeight:'160px', width:'100%'}}>
                        <div style={{textAlign:'left', display:'flex', flexDirection:'row', gap:'8px', justifyContent:'left', width:'100%'}}>
                        <p className="vendor-location"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
  <path d="M15.9676 11.7334C15.2798 13.127 14.3489 14.5164 13.3951 15.7632C12.4442 17.0061 11.4902 18.0821 10.7726 18.8481C10.6772 18.9499 10.5862 19.0461 10.5 19.1363C10.4138 19.0461 10.3228 18.9499 10.2274 18.8481C9.50982 18.0821 8.55577 17.0061 7.60495 15.7632C6.65115 14.5164 5.7202 13.127 5.03243 11.7334C4.33756 10.3255 3.9375 9.00625 3.9375 7.875C3.9375 4.25063 6.87563 1.3125 10.5 1.3125C14.1244 1.3125 17.0625 4.25063 17.0625 7.875C17.0625 9.00625 16.6624 10.3255 15.9676 11.7334ZM10.5 21C10.5 21 18.375 13.5367 18.375 7.875C18.375 3.52576 14.8492 0 10.5 0C6.15076 0 2.625 3.52576 2.625 7.875C2.625 13.5367 10.5 21 10.5 21Z" fill="#7E7684"/>
  <path d="M10.5 10.5C9.05025 10.5 7.875 9.32475 7.875 7.875C7.875 6.42525 9.05025 5.25 10.5 5.25C11.9497 5.25 13.125 6.42525 13.125 7.875C13.125 9.32475 11.9497 10.5 10.5 10.5ZM10.5 11.8125C12.6746 11.8125 14.4375 10.0496 14.4375 7.875C14.4375 5.70038 12.6746 3.9375 10.5 3.9375C8.32538 3.9375 6.5625 5.70038 6.5625 7.875C6.5625 10.0496 8.32538 11.8125 10.5 11.8125Z" fill="#7E7684"/>
</svg> {vendor.business_address || "Location not available"}</p>
                        <p className="vendor-price"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 14 14" fill="none">
  <path d="M3.5 9.43363C3.62934 10.8923 4.82383 11.9268 6.64219 12.0608V13.125H7.55517V12.0608C9.54091 11.9045 10.7734 10.803 10.7734 9.17315C10.7734 7.78144 9.94414 6.97767 8.18665 6.52369L7.55517 6.35996V3.03326C8.53663 3.13001 9.19854 3.65841 9.36592 4.4473H10.6517C10.5072 3.04815 9.30506 2.04344 7.55517 1.9318V0.875H6.64219V1.95413C4.94556 2.15507 3.7815 3.24165 3.7815 4.71522C3.7815 5.98785 4.62601 6.88837 6.10961 7.26792L6.64219 7.40933V10.937C5.6379 10.7881 4.94556 10.2374 4.77818 9.43363H3.5ZM6.4672 6.07716C5.55421 5.84645 5.06729 5.35525 5.06729 4.66312C5.06729 3.83703 5.68355 3.22676 6.64219 3.06303V6.12181L6.4672 6.07716ZM7.8595 7.71446C8.98551 7.99727 9.48004 8.46613 9.48004 9.26245C9.48004 10.2225 8.75727 10.8625 7.55517 10.9593V7.64004L7.8595 7.71446Z" fill="#7E7684"/>
</svg> Base Price ${vendor.minimum_price || "0"}</p>    
                        </div>

                        <div className="vendor-description" style={{textAlign:'left'}}>
                            <p style={{textAlign:'left'}}><strong>
                                {expandedDescriptions[vendor.id] 
                                    ? vendor.business_description 
                                    : truncateText(vendor.business_description)}
                            </strong></p>
                            {vendor.business_description && vendor.business_description.length > 150 && (
                                <button 
                                    onClick={() => toggleDescription(vendor.id)}
                                    className="read-more-button"
                                >
                                    {expandedDescriptions[vendor.id] ? 'Read Less' : 'Read More'}
                                </button>
                            )}
                        </div>
                        <div className="vendor-story">
                            <p className="vendor-description">
                                {expandedStories[vendor.id] ? vendor.story : truncateText(vendor.story)}
                            </p>
                            {vendor.story && vendor.story.length > 150 && (
                                <button 
                                    onClick={() => toggleStory(vendor.id)}
                                    className="read-more-button"
                                >
                                    {expandedStories[vendor.id] ? 'Read Less' : 'Read More'}
                                </button>
                            )}
                        </div>
                        </div>

                        {vendor.specializations && vendor.specializations.length > 0 && (
                            <ul className="vendor-specializations">
                                {vendor.specializations.map((specialization, index) => (
                                    <li key={index}>{specialization}</li>
                                ))}
                            </ul>
                        )}
                        <div className="vendor-buttons">
                            <button className="vendor-button" onClick={() => handleGetQuote(vendor)}>Get a Tailored Quote</button>
                            <button className="vendor-button-secondary" onClick={() => handleMoreInfo(vendor)}>More Info</button>
                        </div>
                    </div>
                </div>
            ))}
            {modalOpen && (
                <div className="modal" onClick={closeModal}>
                    <span className="close" onClick={closeModal}>&times;</span>
                    <div className="modal-content-wrapper" onClick={e => e.stopPropagation()}>
                        {modalMedia?.type === 'video' ? (
                            <div className="video-modal-container">
                                <video 
                                    className="modal-content video"
                                    controls
                                    autoPlay
                                    src={modalMedia.url}
                                    onClick={e => e.stopPropagation()}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        ) : (
                            <img 
                                className="modal-content" 
                                src={modalMedia?.url} 
                                alt="Full Size" 
                                onClick={e => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>
            )}
            {totalPages > 1 && (
                <div className="pagination">
                    {currentPage > 1 && (
                        <button className='pagination-btn' onClick={() => handlePageChange(currentPage - 1)}>
                            Previous
                        </button>
                    )}
                    <span>Page {currentPage} of {totalPages}</span>
                    {currentPage < totalPages && (
                        <button className='pagination-btn' onClick={() => handlePageChange(currentPage + 1)}>
                            Next
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VendorList;

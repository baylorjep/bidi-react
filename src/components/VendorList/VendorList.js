import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { supabase } from '../../supabaseClient';
import '../../styles/VendorList.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Verified from '../../assets/Frame 1162.svg';
import StarIcon from '../../assets/star-duotone.svg'; // Assuming you have a star icon

const VendorList = ({ selectedCategory, sortOrder, location, categoryType }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [expandedStories, setExpandedStories] = useState({});
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    const [imageLoading, setImageLoading] = useState({});
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

    const preloadImage = useCallback((src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
        });
    }, []);

    const handleImageLoad = useCallback((imageId) => {
        setImageLoading(prev => ({
            ...prev,
            [imageId]: false
        }));
    }, []);

    useEffect(() => {
        const fetchVendors = async () => {
            let query = supabase
                .from('business_profiles')
                .select('*')
                .or('stripe_account_id.not.is.null,stripe_account_id.not.eq.,Bidi_Plus.eq.true');

            if (selectedCategory) {
                query = query.eq('business_category', selectedCategory);
            }

            if (categoryType) {
                query = query.contains('specializations', [categoryType]);
            }

            const { data: vendorData, error: vendorError } = await query;

            if (vendorError) {
                console.error('Error fetching vendors:', vendorError);
                setLoading(false);
                return;
            }

            const { data: photoData, error: photoError } = await supabase
                .from('profile_photos')
                .select('*')
                .eq('photo_type', 'profile');

            if (photoError) {
                console.error('Error fetching profile photos:', photoError);
                setLoading(false);
                return;
            }

            const vendorsWithPhotos = await Promise.all(vendorData.map(async vendor => {
                const profilePhoto = photoData.find(photo => photo.user_id === vendor.id);
                const profilePhotoUrl = profilePhoto ? profilePhoto.photo_url : '/images/default.jpg';

                // Fetch both portfolio images and videos
                const { data: mediaData, error: mediaError } = await supabase
                    .from('profile_photos')
                    .select('photo_url, photo_type')
                    .eq('user_id', vendor.id)
                    .or('photo_type.eq.portfolio,photo_type.eq.video');

                if (mediaError) {
                    console.error('Error fetching portfolio media:', mediaError);
                }

                // Separate videos and images
                const portfolioVideos = mediaData ? mediaData.filter(item => item.photo_type === 'video').map(item => item.photo_url) : [];
                const portfolioPhotos = mediaData ? mediaData.filter(item => item.photo_type === 'portfolio').map(item => item.photo_url) : [];

                // Combine videos first, then photos
                const allMedia = [...portfolioVideos, ...portfolioPhotos];

                // Fetch average rating from reviews table
                const { data: reviewData, error: reviewError } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('vendor_id', vendor.id);

                if (reviewError) {
                    console.error('Error fetching reviews:', reviewError);
                }

                const averageRating = reviewData.length > 0
                    ? (reviewData.reduce((acc, review) => acc + review.rating, 0) / reviewData.length).toFixed(1)
                    : null;

                // Add a location match score
                const locationMatchScore = location && vendor.business_address
                    ? vendor.business_address.toLowerCase().includes(location.toLowerCase().replace(/-/g, ' '))
                        ? 1  // Direct match
                        : 0  // No match
                    : 0;     // No location specified

                return {
                    ...vendor,
                    profile_photo_url: profilePhotoUrl,
                    portfolio_photos: allMedia,
                    average_rating: averageRating,
                    locationMatchScore
                };
            }));

            // Define sortByPhotos function before using it
            const sortByPhotos = (a, b) => {
                const aHasPhotos = a.portfolio_photos.length > 0;
                const bHasPhotos = b.portfolio_photos.length > 0;
                if (aHasPhotos && !bHasPhotos) return -1;
                if (!aHasPhotos && bHasPhotos) return 1;
                return 0;
            };

            // Sort vendors based on multiple criteria
            let sortedVendors = vendorsWithPhotos.sort((a, b) => {
                // First sort by location if specified
                if (location) {
                    const locationDiff = b.locationMatchScore - a.locationMatchScore;
                    if (locationDiff !== 0) return locationDiff;
                }

                // Then apply the regular sorting logic
                const photoSort = sortByPhotos(a, b);
                if (photoSort !== 0) return photoSort;

                switch (sortOrder) {
                    case 'recommended':
                        const aIsVerified = a.membership_tier === 'Verified' || a.Bidi_Plus === true;
                        const bIsVerified = b.membership_tier === 'Verified' || b.Bidi_Plus === true;
                        if (aIsVerified && !bIsVerified) return -1;
                        if (!aIsVerified && bIsVerified) return 1;
                        return 0;
                    case 'rating':
                        return (b.average_rating || 0) - (a.average_rating || 0);
                    case 'base_price_low':
                        return (a.minimum_price || 0) - (b.minimum_price || 0);
                    case 'base_price_high':
                        return (b.minimum_price || 0) - (a.minimum_price || 0);
                    case 'newest':
                        return new Date(b.created_at) - new Date(a.created_at);
                    case 'oldest':
                        return new Date(a.created_at) - new Date(b.created_at);
                    default:
                        return 0;
                }
            });

            setVendors(sortedVendors);
            setLoading(false);
        };

        fetchVendors();
    }, [selectedCategory, sortOrder, location, categoryType]);

    if (loading) {
        return <div>Loading...</div>;
    }

    const settings = {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />
    };

    function SampleNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
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
                    transform: 'translateY(-50%)' 
                }}
            >
            </div>
        );
    }

    function SamplePrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
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
                    zIndex: '10'
                }}
            >
            </div>
        );
    }

    const openModal = (image) => {
        setModalImage(image);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalImage('');
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
                                    const isVideo = item.includes('.mp4');

                                    // Preload the next image
                                    if (index < vendor.portfolio_photos.length - 1) {
                                        preloadImage(vendor.portfolio_photos[index + 1]);
                                    }

                                    return (
                                        <div key={index} onClick={() => openModal(item)}>
                                            {isVideo ? (
                                                <video
                                                    src={item}
                                                    className="portfolio-image"
                                                    controls
                                                    loading="lazy"
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <div className="image-container">
                                                    {imageLoading[imageId] && (
                                                        <div className="image-placeholder">
                                                            Loading...
                                                        </div>
                                                    )}
                                                    <img
                                                        src={item}
                                                        alt={`Portfolio ${index}`}
                                                        className={`portfolio-image ${imageLoading[imageId] ? 'loading' : 'loaded'}`}
                                                        loading="lazy"
                                                        onLoad={() => handleImageLoad(imageId)}
                                                        style={{
                                                            opacity: imageLoading[imageId] ? 0 : 1,
                                                            transition: 'opacity 0.3s ease-in-out'
                                                        }}
                                                    />
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
                    <span className="close">&times;</span>
                    <img className="modal-content" src={modalImage} alt="Full Size" />
                </div>
            )}
        </div>
    );
};

export default VendorList;

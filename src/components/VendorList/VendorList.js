import React, { useEffect, useState, useRef } from 'react';
import Slider from 'react-slick';
import { supabase } from '../../supabaseClient';
import '../../styles/VendorList.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Verified from '../../assets/Frame 1162.svg';
import StarIcon from '../../assets/star-duotone.svg'; // Assuming you have a star icon

const VendorList = ({ selectedCategory, sortOrder }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const sliderRef = useRef(null);

    useEffect(() => {
        const fetchVendors = async () => {
            let query = supabase
                .from('business_profiles')
                .select('*');

            if (selectedCategory) {
                query = query.eq('business_category', selectedCategory);
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

                const { data: portfolioData, error: portfolioError } = await supabase
                    .from('profile_photos')
                    .select('photo_url')
                    .eq('user_id', vendor.id)
                    .eq('photo_type', 'portfolio');

                if (portfolioError) {
                    console.error('Error fetching portfolio images:', portfolioError);
                }

                const portfolioPhotos = portfolioData ? portfolioData.map(img => img.photo_url) : [];

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

                return {
                    ...vendor,
                    profile_photo_url: profilePhotoUrl,
                    portfolio_photos: portfolioPhotos,
                    average_rating: averageRating
                };
            }));

            // Sort vendors based on the sortOrder and prioritize profiles with photos
            const sortedVendorData = vendorsWithPhotos.sort((a, b) => {
                const aHasPhotos = a.portfolio_photos.length > 0;
                const bHasPhotos = b.portfolio_photos.length > 0;

                if (aHasPhotos && !bHasPhotos) return -1;
                if (!aHasPhotos && bHasPhotos) return 1;

                switch (sortOrder) {
                    case 'rating':
                        return b.rating - a.rating;
                    case 'distance':
                        return a.distance - b.distance;
                    case 'newest':
                        return new Date(b.created_at) - new Date(a.created_at);
                    case 'oldest':
                        return new Date(a.created_at) - new Date(b.created_at);
                    case 'base_price_low':
                        return a.minimum_price - b.minimum_price;
                    case 'base_price_high':
                        return b.minimum_price - a.minimum_price;
                    default:
                        return 0; // Recommended or default sorting
                }
            });

            setVendors(sortedVendorData);
            setLoading(false);
        };

        fetchVendors();
    }, [selectedCategory, sortOrder]);

    if (loading) {
        return <div>Loading...</div>;
    }

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };

    function SampleNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
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
                onClick={() => sliderRef.current.slickNext()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        );
    }

    function SamplePrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
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
                    zIndex: '2'
                }}
                onClick={() => sliderRef.current.slickPrev()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15.0898 4.08008L8.56982 10.6001C7.79982 11.3701 7.79982 12.6301 8.56982 13.4001L15.0898 19.9201" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
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

    return (
        <div className="vendor-list">
            {vendors.map(vendor => (
                <div key={vendor.id} className="vendor-card">
                    <div className="portfolio-images">
                        {vendor.portfolio_photos.length > 0 ? (
                            <Slider ref={sliderRef} {...settings}>
                                {vendor.portfolio_photos.map((photo, index) => (
                                    <div key={index} onClick={() => openModal(photo)}>
                                        <img src={photo} alt={`Portfolio ${index}`} className="portfolio-image" />
                                    </div>
                                ))}
                            </Slider>
                        ) : (
                            <img src="/images/default.jpg" alt="No portfolio available" className="portfolio-image" />
                        )}
                        <SampleNextArrow />
                        <SamplePrevArrow />
                    </div>
                    <div className="vendor-info">
                        <div className="vendor-header">
                            <img src={vendor.profile_photo_url} alt={vendor.business_name} className="vendor-profile-image" onError={(e) => { e.target.src = '/images/default.jpg'; }} />
                            <div style={{display:'flex', flexDirection:'row', justifyContent:'center', alignItems:'left', marginLeft:'12px'}}>
                            <h2 className="vendor-name">
                                {vendor.business_name}
                            </h2>
                            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'left'}}>
                                {vendor.average_rating && (
                                    <span className="vendor-rating">
                                        <img src={StarIcon} alt="Star" className="star-icon" />
                                        {vendor.average_rating}
                                    </span>
                                )}
                            </div>
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
                            </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', minHeight:'160px'}}>
                        <div style={{textAlign:'left', display:'flex', flexDirection:'row', gap:'8px', justifyContent:'left', width:'100%'}}>
                        <p className="vendor-location"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
  <path d="M15.9676 11.7334C15.2798 13.127 14.3489 14.5164 13.3951 15.7632C12.4442 17.0061 11.4902 18.0821 10.7726 18.8481C10.6772 18.9499 10.5862 19.0461 10.5 19.1363C10.4138 19.0461 10.3228 18.9499 10.2274 18.8481C9.50982 18.0821 8.55577 17.0061 7.60495 15.7632C6.65115 14.5164 5.7202 13.127 5.03243 11.7334C4.33756 10.3255 3.9375 9.00625 3.9375 7.875C3.9375 4.25063 6.87563 1.3125 10.5 1.3125C14.1244 1.3125 17.0625 4.25063 17.0625 7.875C17.0625 9.00625 16.6624 10.3255 15.9676 11.7334ZM10.5 21C10.5 21 18.375 13.5367 18.375 7.875C18.375 3.52576 14.8492 0 10.5 0C6.15076 0 2.625 3.52576 2.625 7.875C2.625 13.5367 10.5 21 10.5 21Z" fill="#7E7684"/>
  <path d="M10.5 10.5C9.05025 10.5 7.875 9.32475 7.875 7.875C7.875 6.42525 9.05025 5.25 10.5 5.25C11.9497 5.25 13.125 6.42525 13.125 7.875C13.125 9.32475 11.9497 10.5 10.5 10.5ZM10.5 11.8125C12.6746 11.8125 14.4375 10.0496 14.4375 7.875C14.4375 5.70038 12.6746 3.9375 10.5 3.9375C8.32538 3.9375 6.5625 5.70038 6.5625 7.875C6.5625 10.0496 8.32538 11.8125 10.5 11.8125Z" fill="#7E7684"/>
</svg> {vendor.business_address || "Location not available"}</p>
                        <p className="vendor-price"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 14 14" fill="none">
  <path d="M3.5 9.43363C3.62934 10.8923 4.82383 11.9268 6.64219 12.0608V13.125H7.55517V12.0608C9.54091 11.9045 10.7734 10.803 10.7734 9.17315C10.7734 7.78144 9.94414 6.97767 8.18665 6.52369L7.55517 6.35996V3.03326C8.53663 3.13001 9.19854 3.65841 9.36592 4.4473H10.6517C10.5072 3.04815 9.30506 2.04344 7.55517 1.9318V0.875H6.64219V1.95413C4.94556 2.15507 3.7815 3.24165 3.7815 4.71522C3.7815 5.98785 4.62601 6.88837 6.10961 7.26792L6.64219 7.40933V10.937C5.6379 10.7881 4.94556 10.2374 4.77818 9.43363H3.5ZM6.4672 6.07716C5.55421 5.84645 5.06729 5.35525 5.06729 4.66312C5.06729 3.83703 5.68355 3.22676 6.64219 3.06303V6.12181L6.4672 6.07716ZM7.8595 7.71446C8.98551 7.99727 9.48004 8.46613 9.48004 9.26245C9.48004 10.2225 8.75727 10.8625 7.55517 10.9593V7.64004L7.8595 7.71446Z" fill="#7E7684"/>
</svg> Base Price ${vendor.minimum_price || "500"}</p>    
                        </div>

                        <p className="vendor-description"><strong>{vendor.business_description}</strong></p>
                        <p className="vendor-description">{vendor.story}</p>
                        </div>

                        {vendor.specializations && vendor.specializations.length > 0 && (
                            <ul className="vendor-specializations">
                                {vendor.specializations.map((specialization, index) => (
                                    <li key={index}>{specialization}</li>
                                ))}
                            </ul>
                        )}
                        <div className="vendor-buttons">
                            <button className="vendor-button">Get a Tailored Quote</button>
                            <button className="vendor-button-secondary">More Info</button>
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

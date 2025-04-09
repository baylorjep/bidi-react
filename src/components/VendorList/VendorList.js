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
    const [loadAllMedia, setLoadAllMedia] = useState(false);
    const [loadingVendors, setLoadingVendors] = useState({});
    const [loadedPhotoCount, setLoadedPhotoCount] = useState({});
    const [sliderDimensions, setSliderDimensions] = useState({ width: 0, height: 0 });
    const [photosLoading, setPhotosLoading] = useState(true);
    const [vendorPhotosLoaded, setVendorPhotosLoaded] = useState({});
    const [loadingRemainingPhotos, setLoadingRemainingPhotos] = useState({});
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

    // Add this function to track when all vendors' initial photos are loaded
    const checkAllVendorsLoaded = useCallback((vendorsData) => {
        return vendorsData.every(vendor => vendorPhotosLoaded[vendor.id]);
    }, [vendorPhotosLoaded]);

    // Add this useEffect to ensure vendorsPerPage is always 5
    useEffect(() => {
        if (vendorsPerPage !== 5) {
            console.warn('vendorsPerPage should be 5');
        }
    }, [vendorsPerPage]);

    // Add useEffect to call fetchVendors when needed
    useEffect(() => {
        fetchVendors();
    }, [selectedCategory, sortOrder, currentPage, vendorsPerPage, preferredLocation, preferredType]);

    // Add effect to check when all vendors are loaded
    useEffect(() => {
        if (vendors.length > 0 && checkAllVendorsLoaded(vendors)) {
            setLoading(false);
        }
    }, [vendors, vendorPhotosLoaded, checkAllVendorsLoaded]);

    // Add intersection observer to detect when vendor cards come into view
    useEffect(() => {
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const vendorId = entry.target.dataset.vendorId;
                    const vendor = vendors.find(v => v.id === vendorId);
                    if (vendor && vendor.has_more_photos) {
                        loadRemainingPhotos(vendor);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        });

        // Observe all vendor cards
        const vendorCards = document.querySelectorAll('.vendor-card');
        vendorCards.forEach(card => observer.observe(card));

        return () => {
            vendorCards.forEach(card => observer.unobserve(card));
            observer.disconnect();
        };
    }, [vendors]);

    const fetchVendors = async () => {
        setLoading(true);
        setVendorPhotosLoaded({});
        
        try {
            let query = supabase
                .from('business_profiles')
                .select('*')
                .or('stripe_account_id.not.is.null,Bidi_Plus.eq.true');

            if (selectedCategory) {
                query = query.eq('business_category', selectedCategory);
            }

            const { data: allVendorData, error: vendorError } = await query;
            if (vendorError) throw vendorError;

            // Set total count for pagination
            setTotalCount(allVendorData.length);
            setTotalCountState(allVendorData.length);

            // Get ALL photos first to calculate counts
            const { data: allPhotos, error: photoError } = await supabase
                .from('profile_photos')
                .select('*')
                .in('user_id', allVendorData.map(v => v.id));

            if (photoError) throw photoError;

            // Get basic vendor info for sorting
            const vendorsWithBasicInfo = allVendorData.map(vendor => {
                const vendorPhotos = allPhotos?.filter(photo => photo.user_id === vendor.id) || [];
                const portfolioPhotoCount = vendorPhotos.filter(
                    photo => photo.photo_type === 'portfolio' || photo.photo_type === 'video'
                ).length;

                return {
                    ...vendor,
                    photo_count: portfolioPhotoCount
                };
            });

            // Sort all vendors first
            const sortedVendors = sortVendors(vendorsWithBasicInfo);
            
            // Get the current page vendors - using 5 vendors per page
            const startIndex = (currentPage - 1) * 5; // Changed to hardcoded 5
            const endIndex = startIndex + 5; // Changed to hardcoded 5
            const currentPageVendors = sortedVendors.slice(startIndex, endIndex);

            // Process vendors with their photos
            const vendorsWithPhotos = await Promise.all(
                currentPageVendors.map(async vendor => {
                    const vendorPhotos = allPhotos?.filter(photo => photo.user_id === vendor.id) || [];
                    const profilePhoto = vendorPhotos.find(photo => photo.photo_type === 'profile');
                    
                    const portfolioPhotos = vendorPhotos
                        .filter(photo => photo.photo_type === 'portfolio' || photo.photo_type === 'video')
                        .slice(0, 10)
                        .map(photo => photo.photo_url);

                    // Mark this vendor's photos as loaded before preloading
                    setVendorPhotosLoaded(prev => ({
                        ...prev,
                        [vendor.id]: true
                    }));

                    // Preload images in the background
                    Promise.all(portfolioPhotos.map(async photo => {
                        if (!isVideo(photo)) {
                            await preloadImage(photo);
                        }
                    })).catch(console.error); // Handle preload errors silently

                    const hasMorePhotos = vendorPhotos.filter(photo => 
                        photo.photo_type === 'portfolio' || photo.photo_type === 'video'
                    ).length > 10;

                    return {
                        ...vendor,
                        profile_photo_url: profilePhoto?.photo_url || '/images/default.jpg',
                        portfolio_photos: portfolioPhotos,
                        has_more_photos: hasMorePhotos
                    };
                })
            );

            setVendors(vendorsWithPhotos);
            setLoading(false); // Set loading to false after vendors are set

        } catch (error) {
            console.error('Error fetching vendors:', error);
            setLoading(false);
        }
    };

    const sortVendors = (vendors) => {
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

            // First priority: Has photos
            if (aHasPhotos !== bHasPhotos) {
                return aHasPhotos ? -1 : 1;
            }

            // Second priority: Verification status (within photo groups)
            if (aIsVerified !== bIsVerified) {
                return aIsVerified ? -1 : 1;
            }

            // Third priority: Total media count
            const aTotalMedia = a.photo_count;
            const bTotalMedia = b.photo_count;
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

        console.log('Vendors after sorting:', sorted.map(v => ({
            id: v.id,
            name: v.business_name,
            photos: v.photo_count,
            videos: v.video_count,
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true
        })));

        return sorted;
    };

    // Update totalPages calculation to use 5 vendors per page
    const totalPages = Math.ceil(totalCount / 5); // Changed to hardcoded 5

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo(0, 0);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    Loading vendors and photos...
                </div>
            </div>
        );
    }

    const settings = {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        dots: false,
        beforeChange: (oldIndex, newIndex) => {
            const currentVendor = vendors[Math.floor(newIndex / 10)]; // Changed from 6 to 10
            
            console.log('Current slide:', newIndex);
            console.log('Current vendor:', currentVendor?.business_name);
            console.log('Photos loaded:', currentVendor?.portfolio_photos.length);
            
            if (currentVendor && currentVendor.has_more_photos) {
                if (newIndex >= currentVendor.portfolio_photos.length - 2) {
                    console.log('Loading more photos for:', currentVendor.business_name);
                    setLoadingVendors(prev => ({
                        ...prev,
                        [currentVendor.id]: true
                    }));
                }
            }
        },
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
        waitForAnimate: true,
        // Add onInit callback
        onInit: () => {
            // Set initial dimensions based on first image
            const sliderContainer = document.querySelector('.portfolio-images');
            if (sliderContainer) {
                setSliderDimensions({
                    width: sliderContainer.offsetWidth,
                    height: sliderContainer.offsetHeight
                });
            }
        }
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
                    display: 'block',
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '40px', 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(14px)', 
                    position: 'absolute', 
                    top: '50%', 
                    right: '10px', 
                    transform: 'translateY(-50%)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 2,
                    content: '"→"'
                }}
            >
                <span style={{ color: '#fff', fontSize: '20px' }}>→</span>
            </button>
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
                    display: 'block',
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '40px', 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(14px)', 
                    position: 'absolute', 
                    top: '50%', 
                    left: '10px', 
                    transform: 'translateY(-50%)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 2
                }}
            >
                <span style={{ color: '#fff', fontSize: '20px' }}>←</span>
            </button>
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

    // Add click handler for loading more photos
    const handleLoadMorePhotos = (vendorId) => {
        setLoadingVendors(prev => ({
            ...prev,
            [vendorId]: true
        }));
    };

    // Add this function to load remaining photos for a vendor
    const loadRemainingPhotos = async (vendor) => {
        if (loadingRemainingPhotos[vendor.id]) return;
        
        setLoadingRemainingPhotos(prev => ({ ...prev, [vendor.id]: true }));
        
        try {
            const { data: remainingPhotos } = await supabase
                .from('profile_photos')
                .select('*')
                .eq('user_id', vendor.id)
                .or('photo_type.eq.portfolio,photo_type.eq.video')
                .order('created_at', { ascending: true })
                .range(10, 999); // Get all remaining photos after the first 10

            if (remainingPhotos && remainingPhotos.length > 0) {
                // Preload the images in the background
                await Promise.all(remainingPhotos.map(async photo => {
                    if (!isVideo(photo.photo_url)) {
                        await preloadImage(photo.photo_url);
                    }
                }));

                // Update the vendor's photos
                setVendors(prevVendors => 
                    prevVendors.map(v => {
                        if (v.id === vendor.id) {
                            return {
                                ...v,
                                portfolio_photos: [
                                    ...v.portfolio_photos,
                                    ...remainingPhotos.map(photo => photo.photo_url)
                                ],
                                has_more_photos: false
                            };
                        }
                        return v;
                    })
                );
            }
        } catch (error) {
            console.error('Error loading remaining photos:', error);
        } finally {
            setLoadingRemainingPhotos(prev => ({ ...prev, [vendor.id]: false }));
        }
    };

    return (
        <div className="vendor-list">
            {vendors.map(vendor => (
                <div key={vendor.id} className="vendor-card" data-vendor-id={vendor.id}>
                    <div className="portfolio-images" style={{ minHeight: '300px' }}>
                        {vendor.portfolio_photos.length > 0 ? (
                            <Slider {...settings}>
                                {vendor.portfolio_photos.map((item, index) => {
                                    const imageId = `${vendor.id}-${index}`;
                                    const itemIsVideo = isVideo(item);

                                    return (
                                        <div key={index} style={{ height: '100%' }}>
                                            <div className="image-container" 
                                                 style={{ 
                                                     height: '100%',
                                                     display: 'flex',
                                                     alignItems: 'center',
                                                     justifyContent: 'center',
                                                     background: '#f5f5f5' // Light background for empty states
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
                                        </div>
                                    );
                                })}
                                {vendor.has_more_photos && (
                                    <div className="loading-more-photos" 
                                         style={{ 
                                             height: '100%',
                                             minHeight: '300px',
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'center'
                                         }}>
                                        {loadingVendors[vendor.id] ? 'Loading more photos...' : ''}
                                    </div>
                                )}
                            </Slider>
                        ) : (
                            <div style={{ 
                                height: '100%',
                                minHeight: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img 
                                    src="/images/default.jpg" 
                                    alt="No portfolio available" 
                                    className="portfolio-image"
                                    loading="lazy"
                                    style={{ objectFit: 'contain', maxHeight: '100%' }}
                                />
                            </div>
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
                            <button className="vendor-button-secondary" onClick={() => handleMoreInfo(vendor)}>See Profile</button>
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

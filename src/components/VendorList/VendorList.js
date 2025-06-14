import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { supabase } from '../../supabaseClient';
import '../../styles/VendorList.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Verified from '../../assets/Frame 1162.svg';
import StarIcon from '../../assets/star-duotone.svg'; // Assuming you have a star icon
import { convertHeicToJpeg, convertToWebP, convertImagesToWebP, clearImageCache, registerServiceWorker } from "../../utils/imageUtils";
import LoadingPlaceholder from '../Common/LoadingPlaceholder';
import ImageErrorBoundary from '../Common/ImageErrorBoundary';
import ImageModal from '../Business/Portfolio/ImageModal';

// Import cities data
const cities = [
    // Salt Lake County
    { id: 'salt-lake-city', name: 'Salt Lake City', county: 'salt-lake' },
    { id: 'west-valley-city', name: 'West Valley City', county: 'salt-lake' },
    { id: 'west-jordan', name: 'West Jordan', county: 'salt-lake' },
    { id: 'sandy', name: 'Sandy', county: 'salt-lake' },
    { id: 'south-jordan', name: 'South Jordan', county: 'salt-lake' },
    { id: 'taylorsville', name: 'Taylorsville', county: 'salt-lake' },
    { id: 'murray', name: 'Murray', county: 'salt-lake' },
    { id: 'millcreek', name: 'Millcreek', county: 'salt-lake' },
    { id: 'cottonwood-heights', name: 'Cottonwood Heights', county: 'salt-lake' },
    { id: 'holladay', name: 'Holladay', county: 'salt-lake' },
    { id: 'herriman', name: 'Herriman', county: 'salt-lake' },
    { id: 'riverton', name: 'Riverton', county: 'salt-lake' },
    { id: 'draper', name: 'Draper', county: 'salt-lake' },
    { id: 'midvale', name: 'Midvale', county: 'salt-lake' },
    { id: 'south-salt-lake', name: 'South Salt Lake', county: 'salt-lake' },

    // Utah County
    { id: 'provo', name: 'Provo', county: 'utah' },
    { id: 'orem', name: 'Orem', county: 'utah' },
    { id: 'lehi', name: 'Lehi', county: 'utah' },
    { id: 'spanish-fork', name: 'Spanish Fork', county: 'utah' },
    { id: 'pleasant-grove', name: 'Pleasant Grove', county: 'utah' },
    { id: 'american-fork', name: 'American Fork', county: 'utah' },
    { id: 'springville', name: 'Springville', county: 'utah' },
    { id: 'payson', name: 'Payson', county: 'utah' },
    { id: 'saratoga-springs', name: 'Saratoga Springs', county: 'utah' },
    { id: 'eagle-mountain', name: 'Eagle Mountain', county: 'utah' },
    { id: 'highland', name: 'Highland', county: 'utah' },
    { id: 'lindon', name: 'Lindon', county: 'utah' },
    { id: 'mapleton', name: 'Mapleton', county: 'utah' },
    { id: 'vineyard', name: 'Vineyard', county: 'utah' },
    { id: 'cedar-hills', name: 'Cedar Hills', county: 'utah' },

    // Davis County
    { id: 'layton', name: 'Layton', county: 'davis' },
    { id: 'bountiful', name: 'Bountiful', county: 'davis' },
    { id: 'clearfield', name: 'Clearfield', county: 'davis' },
    { id: 'syracuse', name: 'Syracuse', county: 'davis' },
    { id: 'kaysville', name: 'Kaysville', county: 'davis' },
    { id: 'farmington', name: 'Farmington', county: 'davis' },
    { id: 'centerville', name: 'Centerville', county: 'davis' },
    { id: 'north-salt-lake', name: 'North Salt Lake', county: 'davis' },
    { id: 'woods-cross', name: 'Woods Cross', county: 'davis' },
    { id: 'clinton', name: 'Clinton', county: 'davis' },
    { id: 'fruit-heights', name: 'Fruit Heights', county: 'davis' },
    { id: 'west-bountiful', name: 'West Bountiful', county: 'davis' },
    { id: 'sunset', name: 'Sunset', county: 'davis' },

    // Weber County
    { id: 'ogden', name: 'Ogden', county: 'weber' },
    { id: 'roy', name: 'Roy', county: 'weber' },
    { id: 'south-ogden', name: 'South Ogden', county: 'weber' },
    { id: 'north-ogden', name: 'North Ogden', county: 'weber' },
    { id: 'washington-terrace', name: 'Washington Terrace', county: 'weber' },
    { id: 'riverdale', name: 'Riverdale', county: 'weber' },
    { id: 'west-haven', name: 'West Haven', county: 'weber' },
    { id: 'pleasant-view', name: 'Pleasant View', county: 'weber' },
    { id: 'harrisville', name: 'Harrisville', county: 'weber' },

    // Washington County
    { id: 'st-george', name: 'St. George', county: 'washington' },
    { id: 'washington-city', name: 'Washington City', county: 'washington' },
    { id: 'hurricane', name: 'Hurricane', county: 'washington' },
    { id: 'santa-clara', name: 'Santa Clara', county: 'washington' },
    { id: 'ivins', name: 'Ivins', county: 'washington' },
    { id: 'la-verkin', name: 'La Verkin', county: 'washington' },

    // Cache County
    { id: 'logan', name: 'Logan', county: 'cache' },
    { id: 'north-logan', name: 'North Logan', county: 'cache' },
    { id: 'smithfield', name: 'Smithfield', county: 'cache' },
    { id: 'hyrum', name: 'Hyrum', county: 'cache' },
    { id: 'providence', name: 'Providence', county: 'cache' },
    { id: 'nibley', name: 'Nibley', county: 'cache' },

    // Box Elder County
    { id: 'brigham-city', name: 'Brigham City', county: 'box-elder' },
    { id: 'tremonton', name: 'Tremonton', county: 'box-elder' },
    { id: 'perry', name: 'Perry', county: 'box-elder' },

    // Tooele County
    { id: 'tooele', name: 'Tooele', county: 'tooele' },
    { id: 'grantsville', name: 'Grantsville', county: 'tooele' },
    { id: 'stansbury-park', name: 'Stansbury Park', county: 'tooele' },

    // Summit County
    { id: 'park-city', name: 'Park City', county: 'summit' },
    { id: 'snyderville', name: 'Snyderville', county: 'summit' },
    { id: 'kimball-junction', name: 'Kimball Junction', county: 'summit' },

    // Iron County
    { id: 'cedar-city', name: 'Cedar City', county: 'iron' },
    { id: 'enoch', name: 'Enoch', county: 'iron' },

    // Other Notable Cities
    { id: 'vernal', name: 'Vernal', county: 'uintah' },
    { id: 'moab', name: 'Moab', county: 'grand' },
    { id: 'price', name: 'Price', county: 'carbon' },
    { id: 'richfield', name: 'Richfield', county: 'sevier' },
    { id: 'heber-city', name: 'Heber City', county: 'wasatch' },
    { id: 'midway', name: 'Midway', county: 'wasatch' },
    { id: 'roosevelt', name: 'Roosevelt', county: 'duchesne' },
    { id: 'ephraim', name: 'Ephraim', county: 'sanpete' },
    { id: 'nephi', name: 'Nephi', county: 'juab' },
    { id: 'delta', name: 'Delta', county: 'millard' },
    { id: 'kanab', name: 'Kanab', county: 'kane' },
    { id: 'blanding', name: 'Blanding', county: 'san-juan' },
    { id: 'monticello', name: 'Monticello', county: 'san-juan' }
];

const VendorList = ({ 
    vendors: initialVendors = [], // Add default empty array
    selectedCategory, 
    sortOrder = 'recommended',
    preferredLocation, 
    categoryType, 
    currentPage, 
    vendorsPerPage,
    setCurrentPage,
    setTotalCount,
    preferredType,
    onVendorSelect,
    onVendorDeselect,
    selectedVendors = [],
    customButtonText = "Get a Tailored Bid",
    showSelectionButton = false,
    selectedCity,
    selectedCounty,
    searchQuery = '' // Add searchQuery prop with default empty string
}) => {
    const [vendors, setVendors] = useState([]);  // Initialize as empty array
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
    const [convertedUrls, setConvertedUrls] = useState({});
    const [convertingImages, setConvertingImages] = useState({});
    const [visibleVendors, setVisibleVendors] = useState([]);
    const observerRef = useRef(null);
    const vendorRefs = useRef({});
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(null);

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

    const preloadImage = useCallback(async (src) => {
        if (isVideo(src) || mediaErrors[src]) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Add crossOrigin for WebP images
            
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

    // Add useEffect to handle both initial vendors and sort order changes
    useEffect(() => {
        console.log('Initial vendors received or sort order changed:', initialVendors);
        if (initialVendors && initialVendors.length > 0) {
            const sortedVendors = sortVendors(initialVendors);
            setVendors(sortedVendors);
            setTotalCount(sortedVendors.length);
            setLoading(false);
        }
    }, [initialVendors, sortOrder]);

    // Separate effect for fetching vendors
    useEffect(() => {
        if (!initialVendors || initialVendors.length === 0) {
            fetchVendors();
        }
    }, [selectedCategory, sortOrder, currentPage, vendorsPerPage, selectedCounty, selectedCity, searchQuery]);

    // Add effect to check when all vendors are loaded
    useEffect(() => {
        if (vendors.length > 0 && checkAllVendorsLoaded(vendors)) {
            setLoading(false);
        }
    }, [vendors, vendorPhotosLoaded, checkAllVendorsLoaded]);

    // Add intersection observer for lazy loading
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const vendorId = entry.target.dataset.vendorId;
                        setVisibleVendors(prev => [...prev, vendorId]);
                    }
                });
            },
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Update visible vendors when vendors change
    useEffect(() => {
        setVisibleVendors([]);
        vendorRefs.current = {};
        
        vendors.forEach(vendor => {
            const ref = document.querySelector(`[data-vendor-id="${vendor.id}"]`);
            if (ref) {
                vendorRefs.current[vendor.id] = ref;
                observerRef.current?.observe(ref);
            }
        });
    }, [vendors]);

    // Convert images for visible vendors
    useEffect(() => {
        const convertVisibleImages = async () => {
            const visibleVendorData = vendors.filter(v => visibleVendors.includes(v.id));
            const allImageUrls = visibleVendorData.flatMap(v => v.portfolio_photos);
            
            const convertedUrls = await convertImagesToWebP(allImageUrls);
            setConvertedUrls(prev => ({ ...prev, ...convertedUrls }));
        };

        convertVisibleImages();
    }, [visibleVendors, vendors]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearImageCache();
        };
    }, []);

    // Register service worker on mount
    useEffect(() => {
        registerServiceWorker();
    }, []);

    // Helper function to normalize business_category
    const getCategories = (category) => Array.isArray(category) ? category : [category].filter(Boolean);

    // Utility to map selector county to short county id
    function getShortCountyId(selectedCounty) {
        console.log('Getting short county ID for:', selectedCounty);
        if (!selectedCounty) {
            console.log('No county selected');
            return '';
        }
        
        // Log the input county
        console.log('Input county:', selectedCounty);
        
        // Handle special cases
        if (selectedCounty === 'salt-lake-county') {
            console.log('Converting salt-lake-county to salt-lake');
            return ['salt-lake', 'slc']; // Return both possible IDs
        }
        if (selectedCounty === 'slc-county') {
            console.log('Converting slc-county to slc');
            return ['slc', 'salt-lake']; // Return both possible IDs
        }
        
        // Remove -county suffix and log the result
        const result = selectedCounty.replace('-county', '');
        console.log('Converted county ID:', result);
        return [result]; // Return as array for consistency
    }

    const fetchVendors = async () => {
        setLoading(true);
        setVendorPhotosLoaded({});
        
        try {
            let query = supabase
                .from('business_profiles')
                .select(`
                    *,
                    reviews (
                        rating
                    ),
                    cities (
                        id,
                        county_id
                    )
                `)
                .or('stripe_account_id.not.is.null,Bidi_Plus.eq.true');

            if (selectedCategory) {
                query = query.contains('business_category', [selectedCategory]);
            }

            // Add search query filter
            if (searchQuery) {
                query = query.ilike('business_name', `%${searchQuery}%`);
            }

            const { data: allVendorData, error: vendorError } = await query;
            
            if (vendorError) {
                console.error('Error fetching vendors:', vendorError);
                throw vendorError;
            }

            console.log('Total vendors found:', allVendorData?.length || 0);

            // Add debug logging
            console.log('Fetched vendors:', allVendorData.map(v => ({
                id: v.id,
                name: v.business_name,
                category: v.business_category,
                specializations: v.specializations,
                location: v.business_address,
                type: categoryType,
                city_id: v.cities?.id,
                county_id: v.cities?.county_id
            })));

            // Calculate average ratings
            const vendorsWithRatings = allVendorData.map(vendor => {
                const ratings = vendor.reviews?.map(review => review.rating) || [];
                const averageRating = ratings.length > 0 
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : null;
                return {
                    ...vendor,
                    business_category: getCategories(vendor.business_category),
                    average_rating: averageRating,
                    city_id: vendor.cities?.id,
                    county_id: vendor.cities?.county_id
                };
            });

            // Set total count for pagination
            setTotalCount(vendorsWithRatings.length);
            setTotalCountState(vendorsWithRatings.length);

            // Get ALL photos first to calculate counts
            const { data: allPhotos, error: photoError } = await supabase
                .from('profile_photos')
                .select('*')
                .in('user_id', vendorsWithRatings.map(v => v.id));

            if (photoError) throw photoError;

            // Get basic vendor info for sorting
            const vendorsWithBasicInfo = vendorsWithRatings.map(vendor => {
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
            const startIndex = (currentPage - 1) * 5;
            const endIndex = startIndex + 5;
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
                    })).catch(console.error);

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
            setLoading(false);

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
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true,
            specializations: v.specializations,
            location: v.business_address,
            hasReviews: v.average_rating !== null,
            rating: v.average_rating
        })));

        const sorted = [...vendors].sort((a, b) => {
            // First priority: Location match
            let aInLocation = false;
            let bInLocation = false;

            if (selectedCity) {
                // Check both primary city and service areas
                aInLocation = a.city_id === selectedCity || (a.service_areas && a.service_areas.includes(selectedCity));
                bInLocation = b.city_id === selectedCity || (b.service_areas && b.service_areas.includes(selectedCity));
            } else if (selectedCounty) {
                // For county, check if the vendor's city or any service area city is in the selected county
                const countyIds = getShortCountyId(selectedCounty);
                aInLocation = countyIds.includes(a.county_id) || 
                             (a.service_areas && a.service_areas.some(area => 
                                 cities.find(c => c.id === area)?.county === selectedCounty
                             ));
                bInLocation = countyIds.includes(b.county_id) || 
                             (b.service_areas && b.service_areas.some(area => 
                                 cities.find(c => c.id === area)?.county === selectedCounty
                             ));
            }

            // If one is in location and other isn't, prioritize the one in location
            if (aInLocation !== bInLocation) {
                return aInLocation ? -1 : 1;
            }

            // If both are in the same location category, continue with other sorting criteria
            // Second priority: Sort order (rating, price, etc.)
            if (sortOrder === 'rating') {
                const aRating = a.average_rating || 0;
                const bRating = b.average_rating || 0;
                if (aRating !== bRating) {
                    return bRating - aRating;
                }
            } else if (sortOrder === 'base_price_low') {
                const aPrice = a.minimum_price || 0;
                const bPrice = b.minimum_price || 0;
                if (aPrice !== bPrice) {
                    return aPrice - bPrice;
                }
            } else if (sortOrder === 'base_price_high') {
                const aPrice = a.minimum_price || 0;
                const bPrice = b.minimum_price || 0;
                if (aPrice !== bPrice) {
                    return bPrice - aPrice;
                }
            }

            // Third priority: Has reviews AND is verified
            const aHasReviews = a.average_rating !== null;
            const bHasReviews = b.average_rating !== null;
            const aIsVerified = a.membership_tier === 'Verified' || a.Bidi_Plus === true;
            const bIsVerified = b.membership_tier === 'Verified' || b.Bidi_Plus === true;

            const aHasReviewsAndVerified = aHasReviews && aIsVerified;
            const bHasReviewsAndVerified = bHasReviews && bIsVerified;

            if (aHasReviewsAndVerified !== bHasReviewsAndVerified) {
                return aHasReviewsAndVerified ? -1 : 1;
            }

            // If both have reviews and are verified, sort by rating
            if (aHasReviewsAndVerified && bHasReviewsAndVerified) {
                return (b.average_rating || 0) - (a.average_rating || 0);
            }

            // Fourth priority: Is verified
            if (aIsVerified !== bIsVerified) {
                return aIsVerified ? -1 : 1;
            }

            // Fifth priority: Has reviews
            if (aHasReviews !== bHasReviews) {
                return aHasReviews ? -1 : 1;
            }

            // If both have reviews but aren't verified, sort by rating
            if (aHasReviews && bHasReviews) {
                return (b.average_rating || 0) - (a.average_rating || 0);
            }

            // Sixth priority: Has photos
            const aHasPhotos = a.photo_count > 0;
            const bHasPhotos = b.photo_count > 0;
            if (aHasPhotos !== bHasPhotos) {
                return aHasPhotos ? -1 : 1;
            }

            // Seventh priority: Has the selected specialization
            if (categoryType && categoryType !== 'all') {
                const aHasSpecialization = a.specializations?.includes(categoryType);
                const bHasSpecialization = b.specializations?.includes(categoryType);
                if (aHasSpecialization !== bHasSpecialization) {
                    return aHasSpecialization ? -1 : 1;
                }
            }

            // Eighth priority: Total media count
            const aTotalMedia = a.photo_count;
            const bTotalMedia = b.photo_count;
            if (aTotalMedia !== bTotalMedia) {
                return bTotalMedia - aTotalMedia;
            }

            return 0;
        });

        console.log('Vendors after sorting:', sorted.map(v => ({
            id: v.id,
            name: v.business_name,
            photos: v.photo_count,
            videos: v.video_count,
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true,
            specializations: v.specializations,
            location: v.business_address,
            hasReviews: v.average_rating !== null,
            rating: v.average_rating
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
            const currentVendor = vendors[Math.floor(newIndex / 10)];
            
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

            // Play the current video
            const currentVideo = document.querySelector(`.slick-current .portfolio-image.video`);
            if (currentVideo) {
                currentVideo.play().catch(error => {
                    console.warn('Error playing video:', error);
                });
                const overlay = currentVideo.parentElement?.querySelector('.video-play-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }
        },
        // Add these settings to ensure proper slider behavior
        accessibility: true,
        draggable: true,
        swipe: true,
        touchMove: true,
        waitForAnimate: true,
        // Add touchAction to allow scrolling
        touchAction: 'pan-y',
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
                <span style={{ color: '#fff', fontSize: '20px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="m9 18 6-6-6-6"/></svg>
                </span>
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
                <span style={{ color: '#fff', fontSize: '20px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m15 18-6-6 6-6"/></svg>
                </span>
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
        // Format the vendor data as expected by MasterRequestFlow
        const vendorData = {
            vendor: {
                id: vendor.id,
                business_name: vendor.business_name,
                business_category: vendor.business_category,
                business_address: vendor.business_address,
                profile_photo_url: vendor.profile_photo_url
            },
            image: vendor.profile_photo_url
        };

        // Format the category to match the expected format in RequestCategories.js
        let formattedCategory;
        if (Array.isArray(vendor.business_category)) {
            formattedCategory = vendor.business_category[0];
        } else {
            formattedCategory = vendor.business_category;
        }
        if (formattedCategory) {
            if (formattedCategory.toLowerCase().includes('wedding planner')) {
                formattedCategory = 'WeddingPlanning';
            } else if (formattedCategory.toLowerCase().includes('beauty')) {
                formattedCategory = 'HairAndMakeup';
            } else {
                formattedCategory = formattedCategory.charAt(0).toUpperCase() + formattedCategory.slice(1).replace(/\s/g, '');
            }
        }

        // Navigate to the master request flow with the vendor data and selected category
        navigate("/master-request-flow", { 
            state: { 
                vendor: vendorData,
                selectedCategories: [formattedCategory]
            }
        });
    };

    const handleMoreInfo = (vendor) => {
        const formattedName = formatBusinessName(vendor.business_name);
        navigate(`/portfolio/${vendor.id}/${formattedName}`);
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

    // Update the image rendering part
    const renderImage = (item, index, vendorId) => {
        const imageId = `${vendorId}-${index}`;
        const itemIsVideo = isVideo(item);

        return (
            <div key={index} style={{ height: '100%' }}>
                <div className="image-container-vendor-list" 
                     style={{ 
                         height: '100%',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         background: '#f5f5f5',
                         touchAction: 'pan-y'
                     }}
                     onClick={() => openModal(item)}
                >
                    {itemIsVideo ? (
                        <div className="video-container-vendor-list " style={{ touchAction: 'pan-y' }}>
                            <video
                                src={item}
                                className="portfolio-image video"
                                muted
                                loop
                                playsInline
                                loading="lazy"
                                preload="metadata"
                                autoPlay
                                style={{ touchAction: 'pan-y' }}
                                onError={(e) => {
                                    console.warn(`Failed to load video: ${item}`);
                                    setMediaErrors(prev => ({
                                        ...prev,
                                        [item]: true
                                    }));
                                }}
                            />
                            {!mediaErrors[item] && (
                                <div className="video-play-overlay" style={{ touchAction: 'pan-y' }}>
                                    <button 
                                        className="play-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const video = e.currentTarget.closest('.video-container-vendor-list')?.querySelector('video');
                                            if (!video) return;

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
                                                        video.closest('.video-container-vendor-list').classList.add('playing');
                                                    })
                                                    .catch(error => {
                                                        console.warn('Error playing video:', error);
                                                    });
                                            } else {
                                                video.pause();
                                                video.closest('.video-container-vendor-list').classList.remove('playing');
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
                                    style={{ touchAction: 'pan-y' }}
                                />
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
                                        opacity: imageLoading[imageId] ? 0.5 : 1,
                                        transition: 'opacity 0.3s ease-in-out',
                                        touchAction: 'pan-y'
                                    }}
                                />
                            )}
                        </ImageErrorBoundary>
                    )}
                </div>
            </div>
        );
    };

    const isVendorSelected = (vendorId) => {
        return selectedVendors.some(v => v.id === vendorId);
    };

    const handleVendorSelect = (vendor) => {
        if (showSelectionButton) {
            if (isVendorSelected(vendor.id)) {
                onVendorDeselect?.(vendor);
            } else {
                onVendorSelect?.(vendor);
            }
        } else {
            handleGetQuote(vendor);
        }
    };

    const handleProfileImageClick = (vendor) => {
        setSelectedImage({
            url: vendor.profile_photo_url,
            isVideo: false,
            categoryMedia: [{
                url: vendor.profile_photo_url,
                type: 'image'
            }],
            currentIndex: 0
        });
    };

    const handleCloseImageModal = () => {
        setSelectedImage(null);
    };

    const formatBusinessName = (name) => {
        if (!name) return '';
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
    };

    const handleVendorClick = (vendor) => {
        const formattedName = formatBusinessName(vendor.business_name);
        navigate(`/portfolio/${vendor.id}/${formattedName}`);
    };

    return (
        <div className="vendor-list">
            {Array.isArray(vendors) && vendors.map(vendor => (
                <div 
                    key={vendor.id} 
                    className="vendor-card" 
                    data-vendor-id={vendor.id}
                    ref={el => vendorRefs.current[vendor.id] = el}
                >
                    <div className="portfolio-images" style={{ minHeight: '300px' }}>
                        {(vendor.portfolio_photos && vendor.portfolio_photos.length > 0) ? (
                            <Slider {...settings}>
                                {vendor.portfolio_photos.map((item, index) => 
                                    item ? renderImage(item, index, vendor.id) : null
                                )}
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
                            <img 
                                src={vendor.profile_photo_url} 
                                alt={vendor.business_name} 
                                className="vendor-profile-image" 
                                onClick={() => handleProfileImageClick(vendor)}
                                style={{ cursor: 'pointer' }}
                                onError={(e) => { e.target.src = '/images/default.jpg'; }} 
                            />
                            <div style={{display:'flex', flexDirection:'row', justifyContent:'center', alignItems:'left', marginLeft:'12px', gap:'4px'}}>
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
                                        <span className="review-count">({vendor.reviews?.length || 0} reviews)</span>
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
</svg> Starting at ${vendor.minimum_price || "0"}</p>    
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
                            <button 
                                className={`vendor-button ${isVendorSelected(vendor.id) ? 'selected' : ''}`}
                                onClick={() => handleVendorSelect(vendor)}
                            >
                                {showSelectionButton 
                                    ? (isVendorSelected(vendor.id) ? 'Selected ✓' : customButtonText)
                                    : 'Get a Tailored Bid'
                                }
                            </button>
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
            <ImageModal
                isOpen={!!selectedImage}
                mediaUrl={selectedImage?.url}
                isVideo={selectedImage?.isVideo}
                onClose={handleCloseImageModal}
                categoryMedia={selectedImage?.categoryMedia || []}
                currentIndex={selectedImage?.currentIndex || 0}
            />
        </div>
    );
};

export default VendorList;

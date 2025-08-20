import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatBusinessName } from '../utils/formatBusinessName';
import { Helmet } from 'react-helmet';
import { FiChevronDown, FiChevronRight, FiChevronLeft, FiSend, FiCheckCircle, FiCalendar, FiStar, FiX } from 'react-icons/fi';
import posthog from 'posthog-js';

// Internal imports
import { supabase } from '../supabaseClient';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import RotatingText from './Layout/RotatingText';
import UserReviews from './UserReviews';
import AnimatedNumber from './AnimatedNumber';
import VendorManager from './WeddingPlanner/VendorManager';
import RequestModal from './Request/RequestModal';

// Assets
import LandingPagePhoto from '../../src/assets/images/Landing Page Photo.jpg';
import LandingPagePhoto2 from '../../src/assets/images/Landing Page Photo 2.jpg';
import LandingPagePhoto3 from '../../src/assets/images/Landing Page Photo 3.jpg';
import LandingPagePhoto4 from '../../src/assets/images/Landing Page Photo 4.jpg';
import LandingPagePhoto5 from '../../src/assets/images/Landing Page Photo 5.jpg';
import LandingPagePhoto6 from '../../src/assets/images/Landing Page Photo 6.jpg';
import WhyBidiPhoto from '../../src/assets/images/Icons/input-search.svg';
import WhyBidiPhoto2 from '../../src/assets/images/Icons/people.svg';
import WhyBidiPhoto3 from '../../src/assets/images/Icons/cash-coin.svg';
import rusticWedding from '../assets/quiz/rustic/rustic-wedding.jpg';

import { colors, spacing, shadows, borderRadius } from '../config/theme';

// Styles
import '../styles/animations.css';
import '../styles/demo.css';

// Add keyframes for vendor scrolling animation
const animations = `
@keyframes scrollVendors {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
}

@keyframes floatIn {
    0% {
        opacity: 0;
        transform: translateY(-100px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideUpIn {
    0% {
        transform: translateY(100%);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Responsive search bar scaling */
.search-bar-inner {
    min-height: 40px;
}

/* Vendor waterfall hover effects - only on desktop */
@media (min-width: 1351px) {
    .vendor-waterfall-item:hover .vendor-waterfall-item-overlay {
        opacity: 1 !important;
    }
}

/* Hide scrollbars for mobile timeline */
.mobile-timeline-container {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.mobile-timeline-container::-webkit-scrollbar {
    display: none;
}

/* iOS input styling fixes */
input[type="date"],
input[type="time"],
input[type="text"],
input[type="number"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border-radius: 8px !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
}

/* iOS specific focus styles */
input[type="date"]:focus,
input[type="time"]:focus,
input[type="text"]:focus,
input[type="number"]:focus {
    outline: none !important;
    border-color: #ec4899 !important;
    box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2) !important;
}

/* Ensure consistent padding and sizing on iOS */
input[type="date"],
input[type="time"],
input[type="text"],
input[type="number"] {
    padding: 12px !important;
    box-sizing: border-box !important;
    width: 100% !important;
}
`;

// Add the keyframes to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = animations;
document.head.appendChild(styleSheet);



// Initialize PostHog for client-side tracking
posthog.init('phc_I6vGPSJc5Uj1qZwGyizwTLCqZyRqgMzAg0HIjUHULSh', {
    api_host: 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });

// Demo component with fake data
function VendorManagerDemo() {
  const fakeWeddingData = {
    id: 'demo-wedding-123',
    user_id: 'demo-user-456',
    wedding_date: '2024-06-15',
    budget: 25000,
    guest_count: 150,
    venue: 'The Grand Ballroom',
    created_at: '2024-01-15T10:00:00Z'
  };

  const fakeVendors = [
    {
      id: 'vendor-1',
      wedding_id: 'demo-wedding-123',
      name: 'Sarah Johnson Photography',
      category: 'photography',
      contact_info: 'email: sarah@johnsonphoto.com, phone: (555) 123-4567, website: www.johnsonphoto.com',
      notes: 'Beautiful portfolio, specializes in natural light photography. Very responsive to messages.',
      pricing: '$2,500 - $3,200',
      rating: 5,
      is_booked: false,
      status: 'confirmed',
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-25T09:15:00Z'
    }
  ];

  const fakeBids = [
    {
      id: 'bid-1',
      request_id: 'photo-request-1',
      user_id: 'business-1',
      bid_amount: 2800,
      description: 'Full day coverage including engagement session, wedding day photography, and beautiful album. I specialize in natural light and candid moments.',
      status: 'approved',
      interest_rating: 5,
      client_notes: 'Love her style! Great portfolio with similar venues.',
      viewed: true,
      created_at: '2024-01-25T10:30:00Z',
      business_profiles: {
        id: 'business-1',
        business_name: 'Sarah Johnson Photography',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    },
    {
      id: 'bid-2',
      request_id: 'photo-request-1',
      user_id: 'business-2',
      bid_amount: 3200,
      description: 'Premium wedding photography package with drone coverage, 8 hours of shooting, and luxury album. Includes engagement session.',
      status: 'interested',
      interest_rating: 4,
      client_notes: 'Great quality but a bit over budget. Love the drone option.',
      viewed: false,
      created_at: '2024-01-26T14:20:00Z',
      business_profiles: {
        id: 'business-2',
        business_name: 'Elite Photography Studio',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    },
    {
      id: 'bid-3',
      request_id: 'photo-request-1',
      user_id: 'business-3',
      bid_amount: 2400,
      description: 'Complete wedding photography coverage with 6 hours of shooting, engagement session, and digital gallery. Perfect for your budget!',
      status: 'pending',
      interest_rating: 3,
      client_notes: 'Good price point, need to see more portfolio samples.',
      viewed: false,
      created_at: '2024-01-27T09:15:00Z',
      business_profiles: {
        id: 'business-3',
        business_name: 'Capture Moments Photography',
        membership_tier: 'standard',
        google_calendar_connected: false,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    },
    {
      id: 'bid-4',
      request_id: 'photo-request-1',
      user_id: 'business-4',
      bid_amount: 3800,
      description: 'Luxury wedding photography experience with 10 hours coverage, engagement session, wedding album, and parent albums. Premium service.',
      status: 'denied',
      interest_rating: 2,
      client_notes: 'Too expensive for our budget.',
      viewed: true,
      created_at: '2024-01-26T16:45:00Z',
      business_profiles: {
        id: 'business-4',
        business_name: 'Luxury Lens Photography',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    }
  ];

  const fakeRequests = [
    {
      id: 'photo-request-1',
      type: 'photography',
      event_type: 'wedding',
      event_date: '2024-06-15',
      price_range: '2,000-3,500',
      status: 'open',
      isOpen: true,
      isNew: true,
      viewCount: 12,
      totalBusinessCount: 45,
      created_at: '2024-01-20T08:00:00Z'
    }
  ];

  // Mock the VendorManager with fake data
  return (
    <div className="vendor-manager-demo">
      <div className="demo-header-bar">
        <div className="demo-status">
          <span className="demo-badge">DEMO</span>
          <span className="demo-text">This is a preview of your actual dashboard</span>
        </div>
      </div>
      
      <div className="demo-vendor-manager-content">
        <VendorManager 
          weddingData={fakeWeddingData}
          onUpdate={() => {}} // No-op for demo
          compact={false}
          demoMode={true} // Add this prop to VendorManager
          demoVendors={fakeVendors}
          demoBids={fakeBids}
          demoRequests={fakeRequests}
        />
      </div>
    </div>
  );
}
  
  function Homepage() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const vendorOptions = [

        { value: 'caterer', label: 'Caterer' },
        { value: 'dj', label: 'DJ' },
        { value: 'florist', label: 'Florist' },
        { value: 'beauty', label: 'Hair & Makeup' },
        { value: 'photographer', label: 'Photographer' },
        { value: 'planner', label: 'Planner' },
        { value: 'videographer', label: 'Videographer' }
    ];

    const toggleVendor = (value) => {
        setSelectedVendors(prev => 
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    // Close dropdown when clicking outside
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsVendorDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const reviewSliderRef = useRef(null);
    const [scrollAmount, setScrollAmount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(null);
    const [stats, setStats] = useState({
        users: 0,
        vendors: 0,
        bids: 0
    });
    const navigate = useNavigate();

    const handleVendorClick = (vendorId, businessName) => {
        const formattedName = formatBusinessName(businessName);
        navigate(`/portfolio/${vendorId}/${formattedName}`);
    };
    
    // Add state for vendor waterfall
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);

    // Fetch vendors data
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                // First get all profile photos
                const { data: allPhotos, error: photoError } = await supabase
                    .from('profile_photos')
                    .select('*')
                    .eq('photo_type', 'profile');

                if (photoError) throw photoError;

                // Get user IDs that have profile photos
                const userIdsWithPhotos = [...new Set(allPhotos.map(photo => photo.user_id))];

                // Then fetch vendors that have profile photos
                const { data, error } = await supabase
                    .from('business_profiles')
                    .select(`
                        *,
                        reviews (
                            rating
                        )
                    `)
                    .in('id', userIdsWithPhotos)
                    .or('stripe_account_id.not.is.null,Bidi_Plus.eq.true')
                    .or('business_category.cs.{photography},business_category.cs.{videography},business_category.cs.{dj},business_category.cs.{catering},business_category.cs.{florist},business_category.cs.{beauty},business_category.cs.{wedding planner/coordinator}')
                    .limit(12);

                if (error) throw error;

                // Calculate average ratings and process vendors
                const vendorsWithRatings = data.map(vendor => {
                    const ratings = vendor.reviews?.map(review => review.rating) || [];
                    const averageRating = ratings.length > 0 
                        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                        : null;
                    return {
                        ...vendor,
                        average_rating: averageRating
                    };
                });

                // Process vendors with their photos
                const vendorsWithPhotos = vendorsWithRatings.map(vendor => {
                    const profilePhoto = allPhotos.find(photo => photo.user_id === vendor.id);
                    return {
                        ...vendor,
                        profile_photo_url: profilePhoto?.photo_url || '/images/default.jpg'
                    };
                });

                // Shuffle the array to show different vendors each time
                const shuffledVendors = vendorsWithPhotos.sort(() => Math.random() - 0.5);

                console.log('Processed vendors:', shuffledVendors);
                setVendors(shuffledVendors);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching vendors:', error);
                setLoading(false);
            }
        };

        fetchVendors();
    }, []);

    // Vendor click handler is defined below with navigate hook
  
    useEffect(() => {
      const fetchSessionAndRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
  
          // Fetch the user's profile to get the role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
  
          if (profile) setRole(profile.role);
        }
      };
  
      fetchSessionAndRole();
  
      // Capture a page view only once on mount
      posthog.capture('page_view', {
        distinctId: user?.id || 'anonymous',
        url: window.location.href,
        page_title: document.title,
      });
    }, []);
  
    useEffect(() => {
      if (reviewSliderRef.current) {
        const totalWidth = reviewSliderRef.current.scrollWidth;
        const cardCount = reviewSliderRef.current.children.length;
        setScrollAmount(totalWidth / cardCount);
      }
    }, []);
  
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get users count (excluding vendors)
                const { count: usersCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact' })
                    .eq('role', 'individual');

                // Get vendors count
                const { count: vendorsCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact' })
                    .eq('role', 'business');

                // Get bids count
                const { count: bidsCount } = await supabase
                    .from('bids')
                    .select('*', { count: 'exact' });

                setStats({
                    users: usersCount || 0,
                    vendors: vendorsCount || 0,
                    bids: bidsCount || 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
        
        // Optional: Set up real-time subscription
        const subscription = supabase
            .channel('stats_changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, fetchStats)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);
  
    // Add refs for each section
    const [mastheadRef, mastheadVisible] = useIntersectionObserver();
    const [connectRef, connectVisible] = useIntersectionObserver();
    const [whyBidiRef, whyBidiVisible] = useIntersectionObserver();
    const [howToRef, howToVisible] = useIntersectionObserver();
    const [reviewsRef, reviewsVisible] = useIntersectionObserver();
    const [newsletterRef, newsletterVisible] = useIntersectionObserver();
    const [tryNowRef, tryNowVisible] = useIntersectionObserver();
    const [faqRef, faqVisible] = useIntersectionObserver();
    const [quizRef, quizVisible] = useIntersectionObserver();

    const toggleAnswer = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [screenSize, setScreenSize] = useState('large');
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [searchFormData, setSearchFormData] = useState({
        date: '',
        time: '',
        location: '',
        guestCount: ''
    });

    // Handle responsive sizing with JavaScript
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            if (width <= 1350) {
                setScreenSize('mobile');
            } else {
                setScreenSize('desktop');
            }
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isVendorDropdownOpen && !event.target.closest('.vendor-dropdown')) {
                setIsVendorDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isVendorDropdownOpen]);

    // Dynamic styles based on screen size (no longer needed since we use fixed desktop styles)
    const getResponsiveStyles = () => {
        return {
            searchBarPadding: '16px',
            fieldPadding: '12px',
            fontSize: '14px',
            buttonPadding: '8px 24px',
            labelMargin: '8px',
            buttonText: 'Get Bids'
        };
    };

    const responsiveStyles = getResponsiveStyles();

  return (
        <>  
            <Helmet>
                <title>Affordable Wedding Vendors for Stress-Free Planning | Bidi</title>
                <meta name="description" content="Bidi simplifies wedding planning with vetted wedding vendors. Post your needs and receive tailored bids from trusted pros. Start planning your perfect day!" />
                <meta name="keywords" content="wedding services, wedding vendors, affordable weddings, wedding photography, wedding DJ, catering services, florist, wedding planning" />
                <script type="application/ld+json">
                    {`
                    
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "WebSite",
                                "url": "https://www.savewithbidi.com/",
                                "name": "Bidi",
                                "description": "Bidi is a bidding platform where you request wedding and local services, and pre-screened professionals bid to provide personalized service. It simplifies finding the perfect wedding vendors, saving you time and effort."
                            },
                            {
                                "@type": "Organization",
                                "name": "Bidi",
                                "url": "https://www.savewithbidi.com/",
                                "contactPoint": {
                                    "@type": "ContactPoint",
                                    "telephone": "385-216-9587",
                                    "contactType": "customer service",
                                    "email": "savewithbidi@gmail.com"
                                },
                                "description": "Bidi connects users with pre-screened, professional wedding vendors and other service providers through a smart bidding system that ensures competitive pricing and reliable service."
                            }
                        ]
                    
                    `}
                </script>
                <meta name="p:domain_verify" content="a66ee7dfca93ec32807ee19ea2319dca"/>
            </Helmet>
            
            <div>
                <div className="tw-flex tw-items-center tw-justify-center tw-flex-col tw-p-4 sm:tw-p-6 md:tw-p-10 tw-min-h-[calc(100vh-100px)] tw-text-center tw-relative" style={{
                    position: 'relative',
                    minHeight: 'calc(100vh - 100px)',
                    paddingBottom: '120px'
                }}>
                    <div 
                        className="tw-absolute tw-w-full tw-h-full tw-top-0 tw-left-0 tw-opacity-10"
                        style={{
                            background: 'radial-gradient(circle at center, #ec4899 0%, transparent 70%)',
                            filter: 'blur(60px)',
                            zIndex: -1
                        }}
                    />
                    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-flex-1 tw-w-full">
                        <h1 
                            className='tw-relative tw-z-10 tw-font-bold tw-leading-tight'
                            style={{
                            fontFamily:'Outfit', 
                                animation: 'floatIn 1.2s ease-out',
                                fontSize: screenSize === 'mobile' ? 
                                    (windowWidth <= 480 ? '2rem' : 
                                     windowWidth <= 640 ? '2.5rem' : 
                                     windowWidth <= 768 ? '2.75rem' : '3rem') : '4rem'
                            }}
                        >
                        Get Quotes & Book Vendors<br></br><span className='tw-text-pink-500 tw-italic'>in Minutes</span>
                    </h1>
                    <h2 
                        className='tw-text-gray-600 tw-mt-2 tw-px-2' 
                        style={{
                            fontFamily:'Outfit',
                            fontSize: screenSize === 'mobile' ? 
                                (windowWidth <= 480 ? '1rem' : 
                                 windowWidth <= 640 ? '1.125rem' : 
                                 windowWidth <= 768 ? '1.25rem' : '1.375rem') : '1.5rem'
                        }}
                    >Simply Post Your Needs, and Get Bids Instantly <svg className="tw-inline tw-ml-1" width="20" height="20" viewBox="0 0 24 24" fill={colors.primary} xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></h2>
                        <div className="tw-flex tw-items-center tw-justify-center tw-flex-col tw-p-4 sm:tw-p-6 md:tw-p-10 tw-text-center tw-w-full" style={{
                            animation: 'fadeInUp 1.2s ease-out 0.3s both',
                            overflow: 'visible'
                        }}>
                            {/* Mobile: Single Button */}
                            {screenSize === 'mobile' ? (
                                <button 
                                    className="tw-w-full tw-max-w-sm tw-py-4 tw-px-8 tw-rounded-full tw-font-semibold tw-text-lg tw-shadow-lg tw-transition-all tw-duration-300 hover:tw-scale-105"
                                    style={{ 
                                        backgroundColor: colors.primary,
                                        color: colors.white,
                                        border: `2px solid ${colors.primary}`
                                    }}
                                    onClick={() => setIsMobileSearchOpen(true)}
                                >
                                    <svg 
                                        width="20" 
                                        height="20" 
                                        viewBox="0 0 24 24" 
                                        fill="white" 
                                        className="tw-inline tw-mr-2"
                                    >
                                        <path d="M10 2a8 8 0 105.293 14.707l4.5 4.5a1 1 0 001.414-1.414l-4.5-4.5A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" fill="white"/>
                                    </svg>
                                    Get Bids From Vendors
                                </button>
                            ) : (
                                /* Desktop: Horizontal Search Bar */
                                                         <div 
                                style={{
                                        maxWidth: '95vw',
                                        width: '100%',
                                    border: `2px solid ${colors.primary}`,
                                    background: colors.white,
                                    position: 'relative',
                                        zIndex: 1,
                                        padding: '16px',
                                        overflow: 'visible'
                                    }} 
                                    className="search-bar tw-flex tw-items-center tw-w-full tw-rounded-full tw-shadow-md">
                                    <div className="search-bar-inner tw-flex tw-w-full tw-items-center tw-gap-0" style={{ overflow: 'visible' }}>  



                                        <div style={{ 
                                            borderRight: `1px solid ${colors.primary}`,
                                            paddingLeft: '12px',
                                            paddingRight: '12px',
                                            overflow: 'visible'
                                        }} className="search-field tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                                            <div className="tw-text-sm tw-text-gray-600 tw-mb-2 tw-text-left tw-truncate">Vendors</div>
                                            <div ref={dropdownRef} className="tw-relative vendor-dropdown" style={{ overflow: 'visible', padding:'12px' }}>
                                                <button
                                                    onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                                                    className="tw-flex tw-items-center tw-justify-between tw-w-full tw-text-sm tw-text-gray-600 tw-bg-transparent focus:tw-outline-none tw-border-none tw-truncate"
                                                    style={{ outline: 'none' }}
                                                >
                                                    {selectedVendors.length === 0 ? (
                                                        <span style={{ color: colors.gray[400] }} className="tw-truncate tw-flex-1 tw-text-left">Select Categories</span>
                                                    ) : (
                                                        <span style={{ color: colors.gray[600] }} className="tw-truncate tw-flex-1 tw-text-left">{selectedVendors.length} selected</span>
                                                    )}
                                                    <FiChevronDown className={`tw-ml-1 tw-transition-transform tw-flex-shrink-0 ${isVendorDropdownOpen ? 'tw-rotate-180' : ''}`} size={14} />
                                                </button>
                                                
                                                {isVendorDropdownOpen && (
                                                    <div 
                                                        className="tw-absolute tw-left-0 tw-right-0 tw-mt-1 tw-rounded-lg tw-shadow-lg tw-border tw-border-gray-200 tw-max-h-[200px] tw-overflow-y-auto" 
                                                        style={{ 
                                                            backgroundColor: colors.white,
                                                            zIndex: 9999,
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: 0,
                                                            right: 0,
                                                            minWidth: '200px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                            border: '1px solid #e5e7eb'
                                                        }}
                                                    >
                                                        <div className="tw-p-2">
                                                            {vendorOptions.map((option) => (
                                                                <label key={option.value} className="tw-flex tw-items-center tw-p-2 tw-rounded tw-cursor-pointer hover:tw-bg-gray-50">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedVendors.includes(option.value)}
                                                                        onChange={() => toggleVendor(option.value)}
                                                                        className="tw-mr-2 tw-appearance-none tw-w-4 tw-h-4 tw-rounded focus:tw-outline-none cursor-pointer"
                                                                        style={{
                                                                            border: `2px solid ${colors.primary}`,
                                                                            backgroundColor: selectedVendors.includes(option.value) ? colors.primary : colors.white,
                                                                            backgroundImage: selectedVendors.includes(option.value) ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")` : '',
                                                                            backgroundSize: '100% 100%'
                                                                        }}
                                                                    />
                                                                    <span style={{ color: colors.gray[700] }} className="tw-text-sm">{option.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div> 

                                        <div style={{ 
                                            borderRight: `1px solid ${colors.primary}`,
                                            paddingLeft: '12px',
                                            paddingRight: '12px'
                                        }} className="search-field tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                                            <div className="tw-text-sm tw-text-gray-600 tw-mb-2 tw-text-left tw-truncate">Event Date</div>
                                        <input 
                                            type="date" 
                                            value={searchFormData.date}
                                            onChange={(e) => setSearchFormData({...searchFormData, date: e.target.value})}
                                            onClick={(e) => e.target.showPicker()}
                                            className="tw-text-sm tw-bg-transparent focus:tw-outline-none tw-border-none tw-appearance-none tw-w-full tw-text-left tw-min-w-0 tw-cursor-pointer"
                                            style={{ color: colors.gray[600] }}
                                            placeholder="Add Date"
                                        />
                                    </div>
                                
                                        <div style={{ 
                                            borderRight: `1px solid ${colors.primary}`,
                                            paddingLeft: '12px',
                                            paddingRight: '12px'
                                        }} className="search-field tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                                            <div className="tw-text-sm tw-text-gray-600 tw-mb-2 tw-text-left tw-truncate">Start Time</div>
                                        <input 
                                            type="time"
                                            value={searchFormData.time}
                                            onChange={(e) => setSearchFormData({...searchFormData, time: e.target.value})}
                                            onClick={(e) => e.target.showPicker()}
                                            className="tw-text-sm tw-bg-transparent focus:tw-outline-none tw-border-none tw-appearance-none tw-w-full tw-text-left tw-min-w-0 tw-cursor-pointer"
                                            style={{ color: colors.gray[600] }}
                                            placeholder="hh : mm XM"
                                        />
                                    </div>
                                
                                        <div style={{ 
                                            borderRight: `1px solid ${colors.primary}`,
                                            paddingLeft: '12px',
                                            paddingRight: '12px'
                                        }} className="search-field tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                                            <div className="tw-text-sm tw-text-gray-600 tw-mb-2 tw-text-left tw-truncate">Location</div>
                                        <input 
                                            type="text"
                                            value={searchFormData.location}
                                            onChange={(e) => setSearchFormData({...searchFormData, location: e.target.value})}
                                                className="tw-text-sm tw-bg-transparent focus:tw-outline-none tw-border-none tw-w-full tw-text-left tw-min-w-0"
                                            style={{ color: colors.gray[600] }}
                                            placeholder="Address, City, State, or Zip Code"
                                        />
                                    </div>
                                
                                        <div style={{ 
                                            borderRight: 'none',
                                            paddingLeft: '12px',
                                            paddingRight: '12px'
                                        }} className="search-field tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                                            <div className="tw-text-sm tw-text-gray-600 tw-mb-2 tw-text-left tw-truncate">Event Size</div>
                                        <input 
                                            type="number"
                                            value={searchFormData.guestCount}
                                            onChange={(e) => setSearchFormData({...searchFormData, guestCount: e.target.value})}
                                                className="tw-text-sm tw-bg-transparent focus:tw-outline-none tw-border-none tw-w-full tw-text-left tw-min-w-0"
                                            style={{ color: colors.gray[600] }}
                                            placeholder="# of Guests"
                                        />
                                    </div>
                                 
                                        <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-pl-4">
                                    <button 
                                                className="tw-py-2 tw-px-6 tw-rounded-full tw-font-semibold tw-whitespace-nowrap tw-cursor-pointer tw-border-none tw-shadow-md tw-transition-colors tw-text-sm tw-hover:tw-scale-105 tw-shadow-sm"
                                        style={{ 
                                            backgroundColor: colors.primary,
                                                    color: colors.white,
                                                    fontFamily: 'Outfit'
                                        }}
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                    Get Bids
                                </button>
                                    </div>
                                    
                            </div>
                        </div>
                            )}
                    </div>
                    </div>
                    
                    {/* Dashboard Button for signed-in users */}
                    {user && role && (
                        <div className="tw-mt-6 tw-flex tw-items-center tw-justify-center">
                            <Link 
                                to={
                                    role === 'individual' ? "/individual-dashboard" :
                                    role === 'business' ? "/business-dashboard" :
                                    role === 'both' ? "/wedding-planner-dashboard/home" :
                                    "/signin"
                                }
                                onClick={() => {
                                    if (role === 'individual') posthog.capture('client_dashboard');
                                    else if (role === 'business') posthog.capture('vendor_dashboard');
                                    else if (role === 'both') posthog.capture('planner_dashboard');
                                }}
                                style={{ textDecoration: 'none' }}
                            >
                                <button 
                                    className="tw-py-3 tw-px-6 tw-rounded-full tw-font-semibold tw-text-sm tw-border tw-transition-all tw-duration-300 hover:tw-scale-105 tw-shadow-sm"
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: colors.primary,
                                        border: `2px solid ${colors.primary}`,
                                        fontFamily: 'Outfit'
                                    }}
                                >
                                    <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke={colors.primary}
                                        strokeWidth="2"
                                        className="tw-inline tw-mr-2"
                                    >
                                        <rect x="3" y="3" width="7" height="7"/>
                                        <rect x="14" y="3" width="7" height="7"/>
                                        <rect x="14" y="14" width="7" height="7"/>
                                        <rect x="3" y="14" width="7" height="7"/>
                                    </svg>
                                    Looking for your dashboard? Click here
                                </button>
                            </Link>
                        </div>
                    )}
                    </div>
                    
                    {/* Our Vendors - Positioned at bottom */}
                    <div className='tw-absolute tw-bottom-4 tw-left-1/2 tw-transform -tw-translate-x-1/2 tw-flex tw-items-center tw-justify-center tw-flex-col tw-text-center'>
                            <div className='tw-text-sm tw-text-gray-600 tw-mb-2'>Our Vendors</div>
                            <div className='tw-flex tw-flex-col tw-items-center tw-gap-1'>
                                <FiChevronDown className="tw-text-gray-600 tw-animate-bounce" size={20} />
                                <FiChevronDown className="tw-text-gray-600 tw-animate-bounce" size={20} style={{marginTop: '-12px'}} />
                            </div>
                    </div>
                       {/* <div className='landing-page-button-container'>
                            {user ? (
                                // Conditionally render different routes based on the role
                                role === 'individual' ? (
                                <Link to="/individual-dashboard" onClick={() => posthog.capture('client_dashboard')}>
                                    <button className='landing-page-button'>See Your Bids</button>
                                </Link>
                                ) : role === 'business' ? (
                                <Link to="/business-dashboard" onClick={() => posthog.capture('vendor_dashboard')}>
                                    <button className='landing-page-button'>See Requests</button>
                                </Link>
                                ) : (
                                role === 'both' ? (
                                <Link to="/wedding-planner-dashboard">
                                    <button className='landing-page-button'>See Dashboard</button>
                                </Link>
                                ) :
                                // Default route if no role is found or unhandled role
                                <Link to="/signin">
                                    <button className='landing-page-button'>Get Started</button>
                                </Link>
                                )
                            ) : (
                                <Link to="/request-categories" onClick={() => posthog.capture('signup_button_click')}>
                                <button className='landing-page-button'>Start Getting Bids</button>
                                </Link>
                            )}
                        </div> */}
            </div>


            <div ref={connectRef} className={`fade-in-section ${connectVisible ? 'is-visible' : ''}`}>
                <h2 className='tw-text-gray-600 tw-text-md tw-mt-2 tw-text-center' style={{fontFamily:'Outfit', fontSize:'1.5rem', marginTop:'1rem'}}>Check Out Our Vendors</h2>
                <div className='tw-flex tw-items-center tw-justify-center tw-flex-col tw-text-center'>
                <button 
                    className="tw-py-2 tw-px-6 tw-rounded-full tw-font-semibold tw-whitespace-nowrap tw-cursor-pointer tw-border-none tw-shadow-md tw-transition-all tw-duration-300 tw-text-sm hover:tw-scale-110"
                    style={{
                        backgroundColor: colors.primary,
                        color: colors.white,
                        marginTop: '1rem'
                    }}
                    onClick={() => navigate('/vendors')}
                >
                    See All Vendors
                </button>

                </div>

                <div className='vendor-waterfall' style={{
                    width: '100%',
                    position: 'relative',
                    height: '100%',
                    overflow: 'hidden',
                    background: 'transparent',
                    padding: '2rem'
                }}>
                {/* Remove the ::before and ::after pseudo-elements */}
                <style>{`
                    .vendor-waterfall::before,
                    .vendor-waterfall::after {
                        display: none !important;
                    }
                `}</style>
                    {loading ? (
                        <div className="vendor-waterfall-loading">
                            Loading vendor profiles...
                        </div>
                    ) : (
                        <div className="vendor-waterfall-grid" style={{
                            display: 'flex',
                            gap: '1rem',
                            width: 'max-content',
                            padding: '1rem',
                            animation: 'scrollVendors 60s linear infinite'
                        }}>
                            {vendors.length > 0 ? (
                                [...vendors, ...vendors, ...vendors, ...vendors].map((vendor, index) => (
                                <div 
                                    key={`${vendor.id}-${index}`} 
                                    className="vendor-waterfall-item"
                                    onClick={() => handleVendorClick(vendor.id, vendor.business_name)}
                                    style={{ 
                                        cursor: 'pointer',
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        height: '300px',
                                        width: '300px',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <img 
                                        src={vendor.profile_photo_url || '/images/default.jpg'} 
                                        alt={vendor.business_name}
                                        onError={(e) => { e.target.src = '/images/default.jpg'; }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <div className="vendor-waterfall-item-overlay" style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: screenSize === 'mobile' 
                                            ? 'linear-gradient(transparent 0%, rgba(0,0,0,0.85) 100%)'
                                            : 'linear-gradient(transparent 0%, rgba(0,0,0,0.85) 100%)',
                                        padding: '1rem',
                                        color: 'white',
                                        opacity: screenSize === 'mobile' ? 1 : 0,
                                        transition: 'opacity 0.3s ease'
                                    }}>
                                        <div className="vendor-waterfall-item-name" style={{
                                            fontSize: screenSize === 'mobile' ? '1rem' : '1.1rem',
                                            fontWeight: 'bold',
                                            marginBottom: '0.25rem',
                                            lineHeight: '1.2'
                                        }}>
                                            {vendor.business_name || 'Unnamed Vendor'}
                                        </div>
                                        <div className="vendor-waterfall-item-category" style={{
                                            fontSize: screenSize === 'mobile' ? '0.85rem' : '0.9rem',
                                            opacity: 0.9,
                                            lineHeight: '1.3'
                                        }}>
                                            {Array.isArray(vendor.business_category) 
                                                ? vendor.business_category.join(', ')
                                                : vendor.business_category || 'Multiple Services'}
                                        </div>
                                    </div>
                                </div>
                            ))) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: colors.gray[600]
                                }}>
                                    No vendor profiles available at the moment.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

                        {/* Combined How It Works + Demo Section */}
                        <div ref={howToRef} className={`fade-in-section ${howToVisible ? 'is-visible' : ''}`}>
                <div className='tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center'>
                    <div className='how-to-sub-title'>Simple and hassle-free.</div>
                    <div className='how-to-title'>How It Works</div>
                    
                    {/* Mobile Compact Timeline */}
                    {screenSize === 'mobile' ? (
                        <div className="tw-mt-6 tw-mb-6">
                            <div 
                                className="tw-flex tw-justify-center tw-items-center tw-px-4"
                                style={{
                                    gap: windowWidth <= 400 ? '4px' : '8px'
                                }}
                            >
                                {[
                                    { number: 1, title: 'Request' },
                                    { number: 2, title: 'Get Bids' },
                                    { number: 3, title: 'Compare' },
                                    { number: 4, title: 'Approve' },
                                    { number: 5, title: 'Book' }
                                ].map((step, index) => (
                                    <div key={step.number} className="tw-flex tw-items-center">
                                        <div className="tw-flex tw-flex-col tw-items-center">
                                            <div 
                                                className="tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-white tw-font-bold tw-mb-1"
                                                style={{ 
                                                    backgroundColor: colors.primary,
                                                    width: windowWidth <= 400 ? '24px' : '32px',
                                                    height: windowWidth <= 400 ? '24px' : '32px',
                                                    fontSize: windowWidth <= 400 ? '10px' : '14px'
                                                }}
                                            >
                                                {step.number}
                                            </div>
                                            <div 
                                                className="tw-font-medium tw-text-gray-700 tw-text-center"
                                                style={{
                                                    fontSize: windowWidth <= 400 ? '10px' : '12px'
                                                }}
                                            >
                                                {step.title}
                                            </div>
                                        </div>
                                        {index < 4 && (
                                            <div 
                                                className="tw-h-0.5 tw-bg-gray-300 tw-mx-1"
                                                style={{
                                                    width: windowWidth <= 400 ? '12px' : '16px',
                                                    marginTop: windowWidth <= 400 ? '-12px' : '-16px'
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Desktop Horizontal Layout */
                                                 <div className="tw-mt-8 tw-mb-8 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center">
                             <div className="tw-flex tw-justify-center tw-items-center tw-px-4 tw-max-w-6xl tw-mx-auto tw-relative">
                                 {[
                                     { number: 1, title: 'Make a Request', subtitle: 'Tell us what you need, your date, and budget.' },
                                     { number: 2, title: 'Get Bids', subtitle: 'Pros send tailored bids to match your request.' },
                                     { number: 3, title: 'Compare Bids', subtitle: 'Review pricing, packages, and ratings in one place.' },
                                     { number: 4, title: 'Approve a Bid', subtitle: 'Choose your favorite vendor with a tap.' },
                                     { number: 5, title: 'Book', subtitle: 'Finalize date and time to lock it in.' }
                                 ].map((step, index) => (
                                     <div key={step.number} className="tw-flex tw-flex-col tw-items-center tw-text-center tw-relative" style={{ minWidth: '180px' }}>
                                         {/* Circle */}
                                         <div 
                                             className="tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-white tw-font-bold tw-mb-4 tw-shadow-lg tw-relative tw-z-10"
                                             style={{ 
                                                 backgroundColor: colors.primary,
                                                 width: '64px',
                                                 height: '64px',
                                                 fontSize: '24px'
                                             }}
                                         >
                                             {step.number}
                                         </div>
                                        
                                         
                                         {/* Title */}
                                         <div 
                                             className="tw-font-bold tw-text-gray-900 tw-mb-2"
                                             style={{
                                                 fontSize: '18px',
                                                 fontFamily: 'Outfit'
                                             }}
                                         >
                                             {step.title}
                                         </div>
                                         
                                         {/* Subtitle */}
                                         <div 
                                             className="tw-text-gray-600 tw-text-center tw-leading-relaxed"
                                             style={{
                                                 fontSize: '14px',
                                                 fontFamily: 'Outfit',
                                                 maxWidth: '160px'
                                             }}
                                         >
                                             {step.subtitle}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}
                </div>

                {/* Demo Section */}
                <div className='demo-container'>
                    <div className='demo-content'>
                        <div className='demo-vendor-manager'>
                            <PhoneHowItWorks />
                        </div>
                    </div>
                    
                    <div className='demo-footer'>
                        <div className='demo-cta' style={{marginTop:'0px'}}>
                            <h3>Ready to try it?</h3>
                            <p>Create your first request and start getting bids today.</p>
                            <Link to="/request-categories" style={{textDecoration:'none'}}>
                                <button className='tw-bg-pink-500 tw-text-white tw-rounded-full tw-px-4 tw-py-2 tw-font-bold tw-shadow-md tw-transition-all tw-duration-300 tw-hover:tw-scale-105 tw-border-none'>Start Planning Now</button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={whyBidiRef} className={`why-bidi-section fade-in-section ${whyBidiVisible ? 'is-visible' : ''}`}>
                <div className='why-bidi'>
                    Simplifying Your Search for Local Sercvices
                </div>
                <div className='reasons-why'>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto}></img>
                        <div className='reason-title'>Convenient & Easy</div>
                        <div className='reason-box'>We hate spending time looking for the perfect fit, and we think you do too. With Bidi, all you do is tell us what you want and we'll find the right service for you. Our smart matching system considers your budget, style preferences, and specific requirements to connect you with vendors who match your needs perfectly.</div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto2}></img>
                        <div className='reason-title'>Transparent Pricing</div>
                        <div className='reason-box'>Our transparent pricing system ensures you always know exactly what you're paying for—no hidden fees, no surprises. Our vendors provide detailed proposals tailored to your specific needs, allowing you to compare services and prices with confidence.</div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto3}></img>
                        <div className='reason-title'>Reliable Experts</div>
                        <div className='reason-box'>With our Bidi verified program, we connect you with local service providers that have been thoroughly vetted for reliability, professionalism, and quality of service. Each vendor undergoes a comprehensive verification process, including review of their portfolio, business credentials, and past client testimonials. You can trust that you're working with experienced professionals who will deliver on their promises.</div>
                    </div>
                </div>
            </div>



<div ref={faqRef} className={`faq-container fade-in-section ${faqVisible ? 'is-visible' : ''}`}>
    <div className='faq-title'>Frequently Asked Questions</div>
    
    {/* FAQ Items */}
    {[
        { question: "Is Bidi free to use?", answer: "Yes! Posting requests and receiving bids are completely free." },
        { question: "How quickly will I get bids?", answer: "Most users start receiving bids within 30 minutes." },
        { question: "Can I choose multiple vendors?", answer: "Absolutely! You can receive bids from multiple vendors and choose the one that best fits your needs." },
        { question: "What types of services can I find on Bidi?", answer: "Bidi connects you with a variety of event vendors, including photographers, caterers, florists, and more." },
        { question: "How do I contact a vendor?", answer: "Once you receive bids, you can directly contact the vendors through our platform to discuss your needs." },
        { question: "What if I have more questions?", answer: "Feel free to reach out to our support team for any additional questions or concerns." },
    ].map((item, index) => (
        <div className='faq-item' key={index} onClick={() => toggleAnswer(index)}>
            <div className='faq-question'>{item.question}</div>
            {activeIndex === index && <div className='faq-answer'>{item.answer}</div>}
        </div>
    ))}
</div>

        <section 
            ref={reviewsRef} 
            className={`fade-in-section ${reviewsVisible ? 'is-visible' : ''}`} 
            id="user-reviews"
        >
            <UserReviews />
        </section>

        <div ref={tryNowRef} className={`try-now-container fade-in-section ${tryNowVisible ? 'is-visible' : ''}`}>
          <div className='try-now-box'>
            <div className='try-now-title'>Ready to Get Bids Instantly? <span className='try-now-highlight'>Join Bidi Today</span></div>
            <div className='try-now-subtitle'>Over 390 users are already finding their perfect wedding vendors. Don't miss out on stress-free hiring.</div>
            <Link to="/request-categories" style={{textDecoration:'none'}}>
            <button className='try-now-button'>Get Started Free</button>
            </Link>
          </div>
        </div>

        <div ref={newsletterRef} className={`newsletter-section fade-in-section ${newsletterVisible ? 'is-visible' : ''}`}>
            <div style={{display:'flex', flexDirection:'column', gap:'20px', alignItems:'center'}}>
            <div className='newsletter-title'>Are You A Event Vendor?</div>
            <div className="newsletter-subtitle">Join Bidi to access hundreds of clients and grow your business—only pay for the bids you win!</div>
            </div>
 
            <div className='newsletter-button-container'>
                <Link className="newsletter-button"to="/for-vendors">
                    <div>Learn More</div>
                </Link>
            </div>

        </div>
        
        {/* Request Modal */}
        {isModalOpen && (
            <RequestModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedVendors={selectedVendors}
                searchFormData={searchFormData}
            />
        )}

        {/* Mobile Search Modal */}
        {isMobileSearchOpen && (
            <MobileSearchModal 
                isOpen={isMobileSearchOpen}
                onClose={() => setIsMobileSearchOpen(false)}
                selectedVendors={selectedVendors}
                toggleVendor={toggleVendor}
                vendorOptions={vendorOptions}
                colors={colors}
                onSubmit={(mobileFormData) => {
                    setSearchFormData(mobileFormData);
                    setIsMobileSearchOpen(false);
                    setIsModalOpen(true);
                }}
            />
        )}
    </>
  );
}

// Mobile Search Modal Component
function MobileSearchModal({ isOpen, onClose, selectedVendors, toggleVendor, vendorOptions, colors, onSubmit }) {
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        location: '',
        guestCount: ''
    });



    if (!isOpen) return null;

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-end tw-justify-center">
            <div 
                className="tw-bg-white tw-w-full tw-max-h-[90vh] tw-rounded-t-2xl tw-overflow-hidden tw-transform tw-transition-transform tw-duration-300 tw-ease-out"
                style={{
                    animation: 'slideUpIn 0.3s ease-out'
                }}
            >
                {/* Header */}
                <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b tw-border-gray-200">
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900" style={{fontFamily:'Outfit', padding:'0px',margin:'0px'}}>Find Your Vendors</h2>
                    <button 
                        onClick={onClose}
                        className="tw-p-2 tw-rounded-full tw-bg-gray-100 hover:tw-bg-gray-200 tw-transition-colors tw-border-none"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="tw-p-4 tw-overflow-y-auto tw-max-h-[calc(90vh-120px)]">
                    <div className="tw-space-y-6">
                        {/* Vendor Services */}
                        <div>
                            <label className="tw-block tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-3">
                                What services do you need?
                            </label>
                            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                                {vendorOptions.map((option) => (
                                    <label key={option.value} className="tw-flex tw-items-center tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedVendors.includes(option.value)}
                                            onChange={() => toggleVendor(option.value)}
                                            className="tw-mr-3 tw-w-5 tw-h-5 tw-text-pink-500 tw-border-gray-300 tw-rounded focus:tw-ring-pink-500"
                                            style={{
                                                accentColor: colors.primary
                                            }}
                                        />
                                        <span className="tw-text-sm tw-font-medium tw-text-gray-700">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    Event Date
                                </label>
                                <input 
                                    type="date" 
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    onClick={(e) => e.target.showPicker()}
                                    className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-pink-500 focus:tw-border-transparent tw-cursor-pointer"
                                    style={{
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        appearance: 'none',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        backgroundColor: '#ffffff',
                                        color: '#374151',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        padding: '12px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    Start Time
                                </label>
                                <input 
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                                    onClick={(e) => e.target.showPicker()}
                                    className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-pink-500 focus:tw-border-transparent tw-cursor-pointer"
                                    style={{
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        appearance: 'none',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        backgroundColor: '#ffffff',
                                        color: '#374151',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        padding: '12px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    Location
                                </label>
                                <input 
                                    type="text"
                                    placeholder="City, State"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-pink-500 focus:tw-border-transparent"
                                    style={{
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        appearance: 'none',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        backgroundColor: '#ffffff',
                                        color: '#374151',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        padding: '12px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    Guest Count
                                </label>
                                <input 
                                    type="number"
                                    placeholder="100"
                                    value={formData.guestCount}
                                    onChange={(e) => setFormData({...formData, guestCount: e.target.value})}
                                    className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-pink-500 focus:tw-border-transparent"
                                    style={{
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        appearance: 'none',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        backgroundColor: '#ffffff',
                                        color: '#374151',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        padding: '12px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="tw-p-4 tw-border-t tw-border-gray-200 tw-bg-gray-50">
                    <button 
                        onClick={() => onSubmit(formData)}
                        disabled={selectedVendors.length === 0}
                        className="tw-w-full tw-py-4 tw-px-6 tw-rounded-lg tw-font-semibold tw-text-lg tw-transition-colors tw-disabled:opacity-50 tw-disabled:cursor-not-allowed tw-border-none"
                        style={{
                            backgroundColor: selectedVendors.length > 0 ? colors.primary : colors.gray[300],
                            color: selectedVendors.length > 0 ? colors.white : colors.gray[500]
                        }}
                    >
                        Get Quotes ({selectedVendors.length} service{selectedVendors.length !== 1 ? 's' : ''} selected)
                    </button>
                </div>
            </div>
        </div>
  );
}

// Interactive phone mockup for How It Works
function PhoneHowItWorks() {
  const [step, setStep] = useState(0);
  const [selectedBidIndex, setSelectedBidIndex] = useState(0);

  const bids = [
    { vendor: 'Sarah Johnson Photography', price: 2800, rating: 5 },
    { vendor: 'Elite Photography Studio', price: 3200, rating: 4 },
    { vendor: 'Capture Moments', price: 2400, rating: 4 },
  ];

  const phoneFrameStyle = {
    width: 320,
    height: 640,
    borderRadius: 36,
    border: `10px solid black`,
    background: colors.white,
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    position: 'relative',
    overflow: 'hidden',
  };

  const notchStyle = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 180,
    height: 26,
    background: 'black',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 2,
  };

  const screenStyle = {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    bottom: 60,
    background: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: colors.white,
    borderBottom: `1px solid ${colors.gray?.[200] || '#e5e7eb'}`,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const footerStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    background: colors.white,
    borderTop: `1px solid ${colors.gray?.[200] || '#e5e7eb'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
  };

  const Button = ({ children, onClick, variant = 'primary', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: variant === 'primary' ? colors.primary : (colors.gray?.[200] || '#e5e7eb'),
        color: variant === 'primary' ? colors.white : (colors.gray?.[700] || '#374151'),
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );

  const renderStars = (count) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar key={i} size={14} color={i < count ? '#fbbf24' : '#d1d5db'} />
      ))}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );

  const ScreenRequest = () => (
    <div style={{ overflowY: 'auto' }}>
      <div style={headerStyle}>
        <div style={{ fontWeight: 700 }}>New Request</div>
        <FiSend color={colors.primary} />
      </div>
      <Section title="Details">
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Category (e.g., Photographer)" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
          <input type="date" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
          <input placeholder="City" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
          <input placeholder="Budget (e.g., $2,500)" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
        </div>
      </Section>
      <div style={{ padding: 16 }}>
        <Button onClick={() => setStep(1)}>Submit Request</Button>
      </div>
    </div>
  );

  const ScreenBids = () => (
    <div style={{ overflowY: 'auto' }}>
      <div style={headerStyle}>
        <div style={{ fontWeight: 700 }}>Bids Received</div>
        <div style={{ fontSize: 12, color: colors.gray?.[500] || '#6b7280' }}>{bids.length} vendors</div>
      </div>
      <div style={{ padding: 8, display: 'grid', gap: 8 }}>
        {bids.map((b, idx) => (
          <div key={idx} style={{ background: colors.white, border: `1px solid ${colors.gray?.[200] || '#e5e7eb'}`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{b.vendor}</div>
              <div style={{ fontSize: 12, color: colors.gray?.[600] || '#4b5563' }}>${b.price.toLocaleString()}</div>
              {renderStars(b.rating)}
            </div>
            <Button variant="secondary" onClick={() => { setSelectedBidIndex(idx); setStep(2); }}>View</Button>
          </div>
        ))}
      </div>
    </div>
  );

  const ScreenBidDetail = () => {
    const b = bids[selectedBidIndex] || bids[0];
    return (
      <div style={{ overflowY: 'auto' }}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiChevronLeft style={{ cursor: 'pointer' }} onClick={() => setStep(1)} />
            <div style={{ fontWeight: 700 }}>{b.vendor}</div>
          </div>
          <div style={{ fontWeight: 700 }}>${b.price.toLocaleString()}</div>
        </div>
        <Section title="Overview">
          <div style={{ color: colors.gray?.[700] || '#374151', fontSize: 14 }}>
            Full-day coverage, engagement session, and online gallery delivery.
          </div>
        </Section>
        <Section title="What's Included">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: colors.gray?.[700] || '#374151' }}>
            <li>8 hours of coverage</li>
            <li>2 photographers</li>
            <li>Edited photos within 2 weeks</li>
          </ul>
        </Section>
        <div style={{ padding: 16, display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
          <Button onClick={() => setStep(3)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FiCheckCircle /> Approve Bid
            </span>
          </Button>
        </div>
      </div>
    );
  };

  const ScreenApproved = () => (
    <div style={{ overflowY: 'auto' }}>
      <div style={headerStyle}>
        <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FiCheckCircle color={colors.primary} /> Bid Approved
        </div>
      </div>
      <Section title="Next Step">
        <div style={{ fontSize: 14, color: colors.gray?.[700] || '#374151' }}>
          Great choice! Proceed to booking to finalize date and time.
        </div>
      </Section>
      <div style={{ padding: 16 }}>
        <Button onClick={() => setStep(4)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FiCalendar /> Proceed to Booking
          </span>
        </Button>
      </div>
    </div>
  );

  const ScreenBooking = () => (
    <div style={{ overflowY: 'auto' }}>
      <div style={headerStyle}>
        <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FiCalendar /> Book Vendor
        </div>
      </div>
      <Section title="Schedule">
        <div style={{ display: 'grid', gap: 8 }}>
          <input type="date" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
          <input type="time" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
          <input placeholder="Notes (optional)" style={{ padding: 10, borderRadius: 8, border: `1px solid ${colors.gray?.[300] || '#d1d5db'}` }} />
        </div>
      </Section>
      <div style={{ padding: 16, display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
        <Button onClick={() => setStep(5)}>Confirm Booking</Button>
      </div>
    </div>
  );

  const ScreenBooked = () => (
    <div style={{ overflowY: 'auto' }}>
      <div style={headerStyle}>
        <div style={{ fontWeight: 700 }}>Booking Confirmed</div>
      </div>
      <div style={{ padding: 24, textAlign: 'center' }}>
        <FiCheckCircle size={48} color={colors.primary} />
        <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>You're all set!</div>
        <div style={{ marginTop: 6, color: colors.gray?.[600] || '#4b5563' }}>We've sent a confirmation to your email.</div>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (step) {
      case 0: return <ScreenRequest />;
      case 1: return <ScreenBids />;
      case 2: return <ScreenBidDetail />;
      case 3: return <ScreenApproved />;
      case 4: return <ScreenBooking />;
      case 5: return <ScreenBooked />;
      default: return <ScreenRequest />;
    }
  };

  const stepsMeta = [
    { label: 'Request' },
    { label: 'Bids' },
    { label: 'Review' },
    { label: 'Approve' },
    { label: 'Book' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding:'20px' }}>
      <div style={phoneFrameStyle}>
        <div style={notchStyle} />
        <div style={screenStyle}>{renderScreen()}</div>
        <div style={footerStyle}>
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FiChevronLeft /> Back
            </span>
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {stepsMeta.map((s, i) => (
              <div key={s.label} onClick={() => setStep(i)} style={{ width: 8, height: 8, borderRadius: 9999, cursor: 'pointer', background: i === step ? colors.primary : (colors.gray?.[300] || '#d1d5db') }} />
            ))}
          </div>
          <Button onClick={() => setStep(Math.min(5, step + 1))}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Next <FiChevronRight />
            </span>
          </Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {stepsMeta.map((s, i) => (
          <button key={s.label} onClick={() => setStep(i)} style={{
            padding: '6px 10px',
            borderRadius: 9999,
            border: `1px solid ${i === step ? colors.primary : (colors.gray?.[300] || '#d1d5db')}`,
            background: i === step ? colors.primary : colors.white,
            color: i === step ? colors.white : (colors.gray?.[700] || '#374151'),
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
export default Homepage;
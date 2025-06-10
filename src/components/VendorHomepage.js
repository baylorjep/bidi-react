import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import posthog from 'posthog-js';
import RotatingText from './Layout/RotatingText';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/animations.css';
import '../styles/VendorComparison.css';
import { Helmet } from 'react-helmet';
import '../styles/VendorHomepage.css';

// Import vendor-specific images (you'll need to add these to your assets)
import VendorHero from '../assets/images/Landing Page Photo 6.jpg';
import GrowthIcon from '../assets/images/Icons/growth.svg';
import TimeIcon from '../assets/images/Icons/time.svg';
import MoneyIcon from '../assets/images/Icons/cash-coin.svg';
import ShieldIcon from '../assets/images/Icons/shield-check.svg';
import LandingPagePhoto2 from '../assets/images/Landing Page Photo 2.jpg';
import LandingPagePhoto3 from '../assets/images/Landing Page Photo 3.jpg';
import LandingPagePhoto4 from '../assets/images/Landing Page Photo 4.jpg';
import LandingPagePhoto5 from '../assets/images/Landing Page Photo 5.jpg';
import LandingPagePhoto6 from '../assets/images/Landing Page Photo 6.jpg';

function VendorHomepage() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeRequests: 0,
        totalBids: 0,
        averageBidValue: 0
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessionAndRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile) setRole(profile.role);
            }
        };

        fetchSessionAndRole();

        posthog.capture('vendor_page_view', {
            distinctId: user?.id || 'anonymous',
            url: window.location.href,
            page_title: document.title,
        });
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Array of all request tables
                const requestTables = [
                    'photography_requests',
                    'videography_requests',
                    'dj_requests',
                    'florist_requests',
                    'beauty_requests',
                    'catering_requests',
                    'requests'
                ];

                // Get active requests count from all tables
                let totalActiveRequests = 0;
                for (const table of requestTables) {
                    const { count } = await supabase
                        .from(table)
                        .select('*', { count: 'exact' })
                        .eq('status', 'open');
                    
                    totalActiveRequests += count || 0;
                }

                // Get total bids count
                const { count: bidsCount } = await supabase
                    .from('bids')
                    .select('*', { count: 'exact' });

                // Get all bid amounts within reasonable bounds (between $100 and $20000)
                const { data: bidAmounts } = await supabase
                    .from('bids')
                    .select('bid_amount')
                    .gt('bid_amount', 100)
                    .lt('bid_amount', 20000);

                // Calculate average manually
                let avgBid = 0;
                if (bidAmounts && bidAmounts.length > 0) {
                    // Sort bids to potentially remove statistical outliers
                    const sortedBids = bidAmounts.map(bid => bid.bid_amount).sort((a, b) => a - b);
                    
                    // Remove the top and bottom 10% of bids to get rid of outliers
                    const trimStart = Math.floor(sortedBids.length * 0.1);
                    const trimEnd = sortedBids.length - trimStart;
                    const trimmedBids = sortedBids.slice(trimStart, trimEnd);
                    
                    // Calculate average of remaining bids
                    const sum = trimmedBids.reduce((acc, amount) => acc + amount, 0);
                    avgBid = Math.round(sum / trimmedBids.length);
                }

                setStats({
                    activeRequests: totalActiveRequests,
                    totalBids: bidsCount || 0,
                    averageBidValue: avgBid
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    useEffect(() => {
        const fetchVendors = async () => {
            setLoading(true);
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
                let query = supabase
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
                    .limit(100); // Fetch more vendors

                const { data: allVendorData, error: vendorError } = await query;
                if (vendorError) throw vendorError;

                // Calculate average ratings and process vendors
                const vendorsWithRatings = allVendorData.map(vendor => {
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

                setVendors(shuffledVendors);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching vendors:', error);
                setLoading(false);
            }
        };

        fetchVendors();
    }, []);

    // Add refs for each section
    const [mastheadRef, mastheadVisible] = useIntersectionObserver();
    const [benefitsRef, benefitsVisible] = useIntersectionObserver();
    const [howItWorksRef, howItWorksVisible] = useIntersectionObserver();
    const [faqRef, faqVisible] = useIntersectionObserver();
    const [ctaRef, ctaVisible] = useIntersectionObserver();

    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAnswer = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const handleVendorClick = (vendorId, businessName) => {
        const formattedName = formatBusinessName(businessName);
        navigate(`/portfolio/${vendorId}/${formattedName}`);
    };

    return (
        <>
            <Helmet>
                <title>Grow Your Wedding Business with Bidi | Vendor Platform</title>
                <meta name="description" content="Join Bidi to grow your wedding business. Connect with engaged couples, receive qualified leads, and only pay for the jobs you win. Start growing your business today!" />
                <meta name="keywords" content="wedding vendor platform, grow wedding business, wedding leads, wedding vendor marketplace, wedding business opportunities" />
            </Helmet>

            <div ref={mastheadRef} className={`masthead-index fade-in-section ${mastheadVisible ? 'is-visible' : ''}`} style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                gap: '6rem',
                maxWidth: '2000px',
                width: '100%',
                margin: '0 auto',
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
            }}>
                <div className='text-section vendor' style={{ 
                    flex: '1',
                    width: window.innerWidth <= 768 ? '100%' : '50%',
                    maxWidth: '800px',
                    paddingRight: window.innerWidth <= 768 ? '0' : '2rem'
                }}>
                    <h1 className='landing-page-title heading-reset' style={{
                        fontSize: window.innerWidth <= 768 ? '2.5rem' : '3.5rem',
                        maxWidth: '700px'
                    }}>
                        Stop Paying for Leads.<br></br>
                        <span className='highlight'>Only Pay When You Get Paid.</span>
                    </h1>
                    <h2 className='landing-page-subtitle heading-reset' style={{
                        marginTop:'20px',
                        fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem',
                        maxWidth: '700px'
                    }}>
                        Join Bidi to connect with local couples actively planning their weddings. With Bidi, you never pay for leads that don't result in money in your pocket.
                        Only pay a small commission when you win the job and get paid by the client.
                    </h2>
                    <div className='landing-page-button-container' style={{
                        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                        gap: window.innerWidth <= 768 ? '10px' : '0'
                    }}>
                        {user ? (
                            role === 'business' ? (
                                <Link to="/dashboard" onClick={() => posthog.capture('vendor_dashboard')}>
                                    <button className='landing-page-button' style={{
                                        width: window.innerWidth <= 768 ? '100%' : 'auto'
                                    }}>View Dashboard</button>
                                </Link>
                            ) : (
                                <Link to="/signup" onClick={() => posthog.capture('vendor_signup')}>
                                    <button className='landing-page-button' style={{
                                        width: window.innerWidth <= 768 ? '100%' : 'auto'
                                    }}>See Local Requests</button>
                                </Link>
                            )
                        ) : (
                            <Link to="/signup" onClick={() => posthog.capture('vendor_signup')}>
                                <button className='landing-page-button' style={{
                                    width: window.innerWidth <= 768 ? '100%' : 'auto'
                                }}>Start Getting Leads</button>
                            </Link>
                        )}
                        <Link 
                            to="/choose-pricing-plan" 
                            className="landing-page-button" 
                            style={{
                                textDecoration: 'none',
                                background: 'transparent',
                                border: '2px solid var(--primary-color, #A328F4)',
                                color: 'var(--primary-color, #A328F4)',
                                padding: '10px 25px',
                                borderRadius: '30px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                marginLeft: window.innerWidth <= 768 ? '0' : '15px',
                                width: window.innerWidth <= 768 ? '100%' : 'auto'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--primary-color, #A328F4)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--primary-color, #A328F4)';
                            }}
                        >
                            View Pricing Plans
                        </Link>
                    </div>
                    <div className='stat-container' style={{
                        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                        gap: window.innerWidth <= 768 ? '10px' : '20px'
                    }}>
                        <div className='stat-box' style={{
                            width: window.innerWidth <= 768 ? '100%' : 'auto'
                        }}>
                            <div className='stat-title-homepage'>Active Local Requests</div>
                            <div className='stat-homepage'>{stats.activeRequests}</div>
                        </div>
                        <div className='stat-box final' style={{
                            width: window.innerWidth <= 768 ? '100%' : 'auto'
                        }}>
                            <div className='stat-title-homepage'>Avg. Job Value</div>
                            <div className='stat-homepage'>${stats.averageBidValue}</div>
                        </div>
                    </div>
                </div>

                <div className='vendor-waterfall' style={{
                    flex: '1',
                    display: window.innerWidth <= 768 ? 'none' : 'block',
                    width: window.innerWidth <= 768 ? '100%' : '50%',
                    maxWidth: '800px',
                    position: 'relative',
                    marginTop: window.innerWidth <= 768 ? '2rem' : '0',
                    height: '700px'
                }}>
                    {loading ? (
                        <div className="vendor-waterfall-loading">
                            Loading vendor profiles...
                        </div>
                    ) : (
                        <div className="vendor-waterfall-grid">
                            {/* Create 4 copies of the vendors array to ensure enough items for continuous flow */}
                            {[...vendors, ...vendors, ...vendors, ...vendors].map((vendor, index) => (
                                <div 
                                    key={`${vendor.id}-${index}`} 
                                    className="vendor-waterfall-item"
                                    onClick={() => handleVendorClick(vendor.id, vendor.business_name)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img 
                                        src={vendor.profile_photo_url} 
                                        alt={vendor.business_name}
                                        onError={(e) => { e.target.src = '/images/default.jpg'; }}
                                    />
                                    <div className="vendor-waterfall-item-overlay">
                                        <div className="vendor-waterfall-item-name">
                                            {vendor.business_name}
                                        </div>
                                        <div className="vendor-waterfall-item-category">
                                            {Array.isArray(vendor.business_category) 
                                                ? vendor.business_category.join(', ')
                                                : vendor.business_category}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div ref={benefitsRef} className={`why-bidi-section fade-in-section ${benefitsVisible ? 'is-visible' : ''}`}>
                <div className='why-bidi' style={{
                    fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem',
                    padding: window.innerWidth <= 768 ? '0 1rem' : '0'
                }}>
                    Why Local Wedding Vendors Love Bidi
                </div>
                <div className='reasons-why' style={{
                    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                    gap: window.innerWidth <= 768 ? '2rem' : '20px',
                    padding: window.innerWidth <= 768 ? '0 1rem' : '0'
                }}>
                    <div className='reason'>
                        <img className='reason-photo' src={ShieldIcon} alt="Shield Icon" style={{
                            filter: 'invert(35%) sepia(72%) saturate(5637%) hue-rotate(262deg) brightness(91%) contrast(93%)'
                        }}/>
                        <div className='reason-title'>Never Pay for Bad Leads</div>
                        <div className='reason-box'>
                            Stop wasting money on leads that don't convert. With Bidi, you only pay when 
                            you successfully win the job and get paid. No more monthly fees or paying for 
                            unqualified leads that go nowhere.
                        </div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo' src={TimeIcon} alt="Time Icon" style={{
                            filter: 'invert(35%) sepia(72%) saturate(5637%) hue-rotate(262deg) brightness(91%) contrast(93%)'
                        }}/>
                        <div className='reason-title'>Simple to Set Up</div>
                        <div className='reason-box'>
                            Get started in minutes, not hours. Create your profile, set your preferences,
                            and start receiving matched requests right away. Our streamlined platform makes
                            it easy to manage your business from anywhere.
                        </div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo' src={GrowthIcon} alt="Growth Icon" style={{
                            filter: 'invert(35%) sepia(72%) saturate(5637%) hue-rotate(262deg) brightness(91%) contrast(93%)'
                        }}/>
                        <div className='reason-title'>Grow Your Business</div>
                        <div className='reason-box'>
                            Connect with couples actively planning their weddings. Our smart matching system 
                            ensures you only see requests that match your services and availability, helping 
                            you grow efficiently and sustainably.
                        </div>
                    </div>
                </div>
            </div>

            <div className='comparison-section' style={{
                padding: window.innerWidth <= 768 ? '2rem 1rem' : '4rem 2rem'
            }}>
                <h2 style={{
                    fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem',
                    marginBottom: '2rem',
                    textAlign: window.innerWidth <= 768 ? 'left' : 'center'
                }}>Why Bidi Beats the Competition</h2>
                
                {window.innerWidth <= 768 ? (
                    // Mobile vertical layout
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            { name: 'Bidi', monthlyFee: 'Free', payWhenWin: '✓', isBidi: true },
                            { name: 'The Knot', monthlyFee: '$150+', payWhenWin: '✕' },
                            { name: 'WeddingWire', monthlyFee: '$130+', payWhenWin: '✕' },
                            { name: 'Thumbtack', monthlyFee: '$99+', payWhenWin: '✕' },
                            { name: 'Bark', monthlyFee: '$89+', payWhenWin: '✕' }
                        ].map((competitor, index) => (
                            <div 
                                key={index}
                                style={{
                                    border: competitor.isBidi ? '2px solid var(--primary-color, #A328F4)' : '1px solid #eee',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    marginBottom: '1rem',
                                    color: competitor.isBidi ? 'var(--primary-color, #A328F4)' : '#000'
                                }}>
                                    {competitor.name}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '500' }}>Monthly Fees</span>
                                        <span style={{ 
                                            color: competitor.isBidi ? 'var(--primary-color, #A328F4)' : 'inherit',
                                            fontWeight: competitor.isBidi ? '600' : 'normal'
                                        }}>{competitor.monthlyFee}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '500' }}>Pay Only When You Win</span>
                                        <span style={{ 
                                            color: competitor.isBidi ? 'var(--primary-color, #A328F4)' : 'inherit',
                                            fontWeight: competitor.isBidi ? '600' : 'normal'
                                        }}>{competitor.payWhenWin}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Desktop horizontal layout
                    <div className='comparison-container'>
                        <table className='comparison-table' style={{
                            width: '100%',
                            borderCollapse: 'separate',
                            borderSpacing: '0',
                            fontSize: '1rem'
                        }}>
                            <thead>
                                <tr className='comparison-header'>
                                    <th className='comparison-feature-header'>Features</th>
                                    <th className='comparison-bidi-header'>
                                        Bidi
                                        <div className='comparison-bidi-underline'></div>
                                    </th>
                                    <th className='comparison-competitor-header'>The Knot</th>
                                    <th className='comparison-competitor-header'>WeddingWire</th>
                                    <th className='comparison-competitor-header'>Thumbtack</th>
                                    <th className='comparison-competitor-header'>Bark</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className='comparison-row'>
                                    <td className='comparison-feature'>Monthly Fees</td>
                                    <td className='comparison-bidi-cell' style={{
                                        color: 'var(--primary-color, #A328F4)',
                                        fontWeight: '600'
                                    }}>Free</td>
                                    <td>$150+</td>
                                    <td>$130+</td>
                                    <td>$99+</td>
                                    <td>$89+</td>
                                </tr>
                                <tr className='comparison-row'>
                                    <td className='comparison-feature'>Pay Only When You Win</td>
                                    <td className='comparison-bidi-cell' style={{
                                        color: 'var(--primary-color, #A328F4)',
                                        fontWeight: '600'
                                    }}>✓</td>
                                    <td>✕</td>
                                    <td>✕</td>
                                    <td>✕</td>
                                    <td>✕</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                <div className='comparison-footer' style={{
                    padding: window.innerWidth <= 768 ? '1.5rem 0 0 0' : '2rem 0 0 0',
                    fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                    lineHeight: '1.5',
                    color: '#666'
                }}>
                    <p>Unlike traditional wedding marketplaces, Bidi puts you in control. No more paying for unqualified leads or monthly fees that eat into your profits. With Bidi, bidding is free and you only pay a small commission when you successfully win the business and get paid by the client.</p>
                </div>
            </div>

            <div ref={howItWorksRef} className={`how-to-use-section fade-in-section ${howItWorksVisible ? 'is-visible' : ''}`} style={{
                padding: window.innerWidth <= 768 ? '2rem 1rem' : '4rem 2rem'
            }}>
                <div className='how-to-text'>
                    <div className='how-to-sub-title' style={{
                        fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem'
                    }}>Simple and effective.</div>
                    <div className='how-to-title' style={{
                        fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem',
                        marginBottom: window.innerWidth <= 768 ? '2rem' : '3rem'
                    }}>How It Works</div>
                    
                    <div className='how-to-number' style={{
                        fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>1</div>
                    <div className='step-container' style={{
                        marginBottom: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>
                        <div className='step-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem'
                        }}>Create Your Vendor Profile</div>
                        <div className='step-sub-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem'
                        }}>
                            Showcase your work, services, and pricing to stand out to potential clients.
                        </div>
                    </div>

                    <div className='how-to-number' style={{
                        fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>2</div>
                    <div className='step-container' style={{
                        marginBottom: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>
                        <div className='step-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem'
                        }}>Receive Matched Requests</div>
                        <div className='step-sub-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem'
                        }}>
                            Get notified of new requests that match your services and availability.
                        </div>
                    </div>

                    <div className='how-to-number' style={{
                        fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>3</div>
                    <div className='step-container' style={{
                        marginBottom: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>
                        <div className='step-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem'
                        }}>Submit Your Bid</div>
                        <div className='step-sub-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem'
                        }}>
                            Send personalized proposals to couples interested in your services.
                        </div>
                    </div>  

                    <div className='how-to-number' style={{
                        fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>4</div>
                    <div className='step-container' style={{
                        marginBottom: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                    }}>
                        <div className='step-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1.2rem' : '1.5rem'
                        }}>Win & Deliver</div>
                        <div className='step-sub-title' style={{
                            fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem'
                        }}>
                            Get booked, deliver amazing service, and grow your business.
                        </div>
                    </div>

                    <div className='landing-page-button-container' style={{
                        width: window.innerWidth <= 768 ? '100%' : 'auto'
                    }}>
                        <Link to="/signup" style={{ width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
                            <button className="landing-page-button" style={{ 
                                width: window.innerWidth <= 768 ? '100%' : '150px',
                                marginLeft: '0'
                            }}>
                                Join Now
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <div ref={faqRef} className={`faq-container fade-in-section ${faqVisible ? 'is-visible' : ''}`} style={{
                padding: window.innerWidth <= 768 ? '2rem 1rem' : '4rem 2rem'
            }}>
                <div className='faq-title' style={{
                    fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem',
                    marginBottom: window.innerWidth <= 768 ? '2rem' : '3rem'
                }}>Vendor FAQs</div>
                
                {[
                    { 
                        question: "What's the catch? How much does it really cost?", 
                        answer: "There's no catch! It's completely free to join, maintain your profile, and submit bids. You only pay a small commission when you successfully win a job and get paid by the client. No monthly fees, no bidding fees - you only pay when you earn." 
                    },
                    { 
                        question: "Are these real, serious leads?", 
                        answer: "Yes! Because we don't make any money from leads, we only make money when you win a job and get paid by the client. This means we only show you leads that are serious about finding their perfect vendor." 
                    },
                    { 
                        question: "How quickly can I start getting leads?", 
                        answer: "You can start receiving matched requests immediately after you sign up. Many vendors receive their first lead within days of joining." 
                    },
                    { 
                        question: "What types of vendors can join?", 
                        answer: "We welcome all professional wedding vendors including photographers, videographers, DJs, florists, caterers, planners, and more. If you provide wedding services, we'd love to have you!" 
                    },
                    { 
                        question: "How do payments work?", 
                        answer: "You receive payments directly from clients through Stripe. Bidi's small bidding fee is handled separately through our secure payment system." 
                    },
                ].map((item, index) => (
                    <div className='faq-item' key={index} onClick={() => toggleAnswer(index)} style={{
                        padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
                        marginBottom: window.innerWidth <= 768 ? '1rem' : '1.5rem'
                    }}>
                        <div className='faq-question' style={{
                            fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.3rem'
                        }}>{item.question}</div>
                        {activeIndex === index && <div className='faq-answer' style={{
                            fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
                            marginTop: window.innerWidth <= 768 ? '0.8rem' : '1rem'
                        }}>{item.answer}</div>}
                    </div>
                ))}
            </div>

            <div ref={ctaRef} className={`try-now-container fade-in-section ${ctaVisible ? 'is-visible' : ''}`} style={{
                padding: window.innerWidth <= 768 ? '2rem 1rem' : '4rem 2rem'
            }}>
                <div className='try-now-box vendor' style={{
                    padding: window.innerWidth <= 768 ? '3rem 1.5rem' : '3rem',
                    minHeight: window.innerWidth <= 768 ? '300px' : 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div className='try-now-title' style={{
                        fontSize: window.innerWidth <= 768 ? '1.8rem' : '2.2rem',
                        marginBottom: window.innerWidth <= 768 ? '1.5rem' : '1rem'
                    }}>Ready to Grow Your Wedding Business? <span className='try-now-highlight'>Join Bidi Today</span></div>
                    <div className='try-now-subtitle' style={{
                        fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem',
                        marginTop: window.innerWidth <= 768 ? '1.5rem' : '1rem',
                        marginBottom: window.innerWidth <= 768 ? '2rem' : '2rem'
                    }}>Join hundreds of successful wedding vendors already growing their business with Bidi.</div>
                    <Link to="/signup" style={{
                        textDecoration:'none',
                        width: window.innerWidth <= 768 ? '100%' : 'auto',
                        marginTop: window.innerWidth <= 768 ? '1rem' : '0'
                    }}>
                        <button className='try-now-button' style={{
                            width: window.innerWidth <= 768 ? '100%' : 'auto',
                            padding: window.innerWidth <= 768 ? '1rem' : '10px 25px'
                        }}>Get Started Free</button>
                    </Link>
                </div>
            </div>
        </>
    );
}

export default VendorHomepage; 
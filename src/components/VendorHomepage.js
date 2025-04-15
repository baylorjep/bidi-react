import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import RotatingText from './Layout/RotatingText';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/animations.css';
import '../styles/VendorComparison.css';
import { Helmet } from 'react-helmet';

// Import vendor-specific images (you'll need to add these to your assets)
import VendorHero from '../assets/images/Landing Page Photo 6.jpg';
import GrowthIcon from '../assets/images/Icons/growth.svg';
import TimeIcon from '../assets/images/Icons/time.svg';
import MoneyIcon from '../assets/images/Icons/cash-coin.svg';
import LandingPagePhoto2 from '../assets/images/Landing Page Photo 2.jpg';
import LandingPagePhoto3 from '../assets/images/Landing Page Photo 3.jpg';
import LandingPagePhoto4 from '../assets/images/Landing Page Photo 4.jpg';
import LandingPagePhoto5 from '../assets/images/Landing Page Photo 5.jpg';
import LandingPagePhoto6 from '../assets/images/Landing Page Photo 6.jpg';

function VendorHomepage() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [stats, setStats] = useState({
        activeRequests: 0,
        totalBids: 0,
        averageBidValue: 0
    });

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

    return (
        <>
            <Helmet>
                <title>Grow Your Wedding Business with Bidi | Vendor Platform</title>
                <meta name="description" content="Join Bidi to grow your wedding business. Connect with engaged couples, receive qualified leads, and only pay for the jobs you win. Start growing your business today!" />
                <meta name="keywords" content="wedding vendor platform, grow wedding business, wedding leads, wedding vendor marketplace, wedding business opportunities" />
            </Helmet>

            <div ref={mastheadRef} className={`masthead-index fade-in-section ${mastheadVisible ? 'is-visible' : ''}`} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2rem',
                gap: '4rem'
            }}>
                <div className='text-section' style={{ flex: '1' }}>
                    <h1 className='landing-page-title heading-reset'>
                        Stop Paying for Leads.<br></br>
                        <span className='highlight'>Only Pay When You Get Paid.</span>
                    </h1>
                    <h2 className='landing-page-subtitle heading-reset' style={{marginTop:'20px'}}>
                        Join Bidi to connect with local couples actively planning their weddings. With Bidi, you never pay for leads that don't result in money in your pocket.
                        Only pay a small commission when you win the job and get paid by the client.
                    </h2>
                    <div className='landing-page-button-container'>
                        {user ? (
                            role === 'business' ? (
                                <Link to="/dashboard" onClick={() => posthog.capture('vendor_dashboard')}>
                                    <button className='landing-page-button'>View Dashboard</button>
                                </Link>
                            ) : (
                                <Link to="/signup" onClick={() => posthog.capture('vendor_signup')}>
                                    <button className='landing-page-button'>See Local Requests</button>
                                </Link>
                            )
                        ) : (
                            <Link to="/signup" onClick={() => posthog.capture('vendor_signup')}>
                                <button className='landing-page-button'>Start Getting Leads</button>
                            </Link>
                        )}
                    </div>
                    <div className='stat-container'>
                        <div className='stat-box'>
                            <div className='stat-title'>Active Local Requests</div>
                            <div className='stat'>{stats.activeRequests}</div>
                        </div>
                        <div className='stat-box final'>
                            <div className='stat-title'>Avg. Job Value</div>
                            <div className='stat'>${stats.averageBidValue}</div>
                        </div>
                    </div>
                </div>

                <div className='vendor-showcase' style={{
                    flex: '1',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    maxWidth: '600px',
                    position: 'relative'
                }}>
                    <div className='vendor-category' style={{
                        position: 'relative',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                    }}>
                        <img src={LandingPagePhoto2} alt="Wedding Photography" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            padding: '1rem',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            Photography
                        </div>
                    </div>
                    <div className='vendor-category' style={{
                        position: 'relative',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                    }}>
                        <img src={LandingPagePhoto3} alt="Wedding Videography" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            padding: '1rem',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            Videography
                        </div>
                    </div>
                    <div className='vendor-category' style={{
                        position: 'relative',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                    }}>
                        <img src={LandingPagePhoto4} alt="Wedding Catering" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            padding: '1rem',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            Catering
                        </div>
                    </div>
                    <div className='vendor-category' style={{
                        position: 'relative',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                    }}>
                        <img src={LandingPagePhoto5} alt="Wedding Florist" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            padding: '1rem',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            Florist
                        </div>
                    </div>
                </div>
            </div>

            <div ref={benefitsRef} className={`why-bidi-section fade-in-section ${benefitsVisible ? 'is-visible' : ''}`}>
                <div className='why-bidi'>
                    Why Local Wedding Vendors Love Bidi
                </div>
                <div className='reasons-why'>
                    <div className='reason'>
                        <img className='reason-photo' src={GrowthIcon} alt="Growth Icon"/>
                        <div className='reason-title'>Real Leads, Not Just Clicks</div>
                        <div className='reason-box'>
                            Connect with high-intent couples actively planning their weddings.
                            Every lead is verified, local, and ready to book. No tire-kickers,
                            just couples serious about finding their perfect vendor.
                        </div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo' src={TimeIcon} alt="Time Icon"/>
                        <div className='reason-title'>Fast & Flexible</div>
                        <div className='reason-box'>
                            Get started in just 5 minutes. Bid from anywhere using your phone.
                            Choose your own schedule and only engage with requests that match
                            your availability and style.
                        </div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo' src={MoneyIcon} alt="Money Icon"/>
                        <div className='reason-title'>You're In Control</div>
                        <div className='reason-box'>
                            No monthly fees or subscriptions. Bidding is completely free - 
                            you only pay a small commission when you win the job and get paid.
                            Keep growing your business on your terms.
                        </div>
                    </div>
                </div>
            </div>

            <div className='comparison-section'>
                <h2>Why Bidi Beats the Competition</h2>
                
                <div className='comparison-container'>
                    <table className='comparison-table'>
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
                                <td className='comparison-bidi-cell'>Free</td>
                                <td>$150+</td>
                                <td>$130+</td>
                                <td>$99+</td>
                                <td>$89+</td>
                            </tr>
                            <tr className='comparison-row'>
                                <td className='comparison-feature'>Pay Only When You Win</td>
                                <td className='comparison-bidi-cell'>✓</td>
                                <td>✕</td>
                                <td>✕</td>
                                <td>✕</td>
                                <td>✕</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className='comparison-footer'>
                    <p>Unlike traditional wedding marketplaces, Bidi puts you in control. No more paying for unqualified leads or monthly fees that eat into your profits. With Bidi, bidding is free and you only pay a small commission when you successfully win the business and get paid by the client.</p>
                </div>
            </div>

            <div ref={howItWorksRef} className={`how-to-use-section fade-in-section ${howItWorksVisible ? 'is-visible' : ''}`}>
                <div className='how-to-text'>
                    <div className='how-to-sub-title'>Simple and effective.</div>
                    <div className='how-to-title'>How It Works</div>
                    
                    <div className='how-to-number'>1</div>
                    <div className='step-container'>
                        <div className='step-title'>Create Your Vendor Profile</div>
                        <div className='step-sub-title'>
                            Showcase your work, services, and pricing to stand out to potential clients.
                        </div>
                    </div>

                    <div className='how-to-number'>2</div>
                    <div className='step-container'>
                        <div className='step-title'>Receive Matched Requests</div>
                        <div className='step-sub-title'>
                            Get notified of new requests that match your services and availability.
                        </div>
                    </div>

                    <div className='how-to-number'>3</div>
                    <div className='step-container'>
                        <div className='step-title'>Submit Your Bid</div>
                        <div className='step-sub-title'>
                            Send personalized proposals to couples interested in your services.
                        </div>
                    </div>  

                    <div className='how-to-number'>4</div>
                    <div className='step-container'>
                        <div className='step-title'>Win & Deliver</div>
                        <div className='step-sub-title'>
                            Get booked, deliver amazing service, and grow your business.
                        </div>
                    </div>

                    <div className='landing-page-button-container'>
                        <Link to="/signup">
                            <button className="landing-page-button" style={{ width: "150px", marginLeft:'0' }}>
                                Join Now
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <div ref={faqRef} className={`faq-container fade-in-section ${faqVisible ? 'is-visible' : ''}`}>
                <div className='faq-title'>Vendor FAQs</div>
                
                {[
                    { 
                        question: "What's the catch? How much does it really cost?", 
                        answer: "There's no catch! It's completely free to join, maintain your profile, and submit bids. You only pay a small commission when you successfully win a job and get paid by the client. No monthly fees, no bidding fees - you only pay when you earn." 
                    },
                    { 
                        question: "How are couples matched with me?", 
                        answer: "Our smart matching system connects you with couples based on your service type, location, availability, and style preferences. You'll only see requests that are relevant to your business." 
                    },
                    { 
                        question: "Are these real, serious leads?", 
                        answer: "Yes! We verify all couples and ensure they're actively planning their wedding. Unlike other platforms, these are high-intent leads from couples ready to book, not just browsing." 
                    },
                    { 
                        question: "How quickly can I start getting leads?", 
                        answer: "You can start receiving matched requests immediately after your profile is approved, which typically takes less than 24 hours. Many vendors receive their first qualified lead within days of joining." 
                    },
                    { 
                        question: "What types of vendors can join?", 
                        answer: "We welcome all professional wedding vendors including photographers, videographers, DJs, florists, caterers, planners, and more. If you provide wedding services, we'd love to have you!" 
                    },
                    { 
                        question: "How do payments work?", 
                        answer: "You receive payments directly from clients through your preferred payment method. Bidi's small bidding fee is handled separately through our secure payment system." 
                    },
                ].map((item, index) => (
                    <div className='faq-item' key={index} onClick={() => toggleAnswer(index)}>
                        <div className='faq-question'>{item.question}</div>
                        {activeIndex === index && <div className='faq-answer'>{item.answer}</div>}
                    </div>
                ))}
            </div>

            <div ref={ctaRef} className={`try-now-container fade-in-section ${ctaVisible ? 'is-visible' : ''}`}>
                <div className='try-now-box'>
                    <div className='try-now-title'>Ready to Grow Your Wedding Business? <span className='try-now-highlight'>Join Bidi Today</span></div>
                    <div className='try-now-subtitle'>Join hundreds of successful wedding vendors already growing their business with Bidi.</div>
                    <Link to="/signup" style={{textDecoration:'none'}}>
                        <button className='try-now-button'>Get Started Free</button>
                    </Link>
                </div>
            </div>
        </>
    );
}

export default VendorHomepage; 
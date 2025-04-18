import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import RotatingText from './Layout/RotatingText';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/animations.css';
import '../styles/VendorComparison.css';
import '../styles/VendorHomepage.css';
import { Helmet } from 'react-helmet';

// Import vendor-specific images
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

// Import category icons
import PhotographyIcon from '../assets/images/Icons/camera.svg';
import VideographyIcon from '../assets/images/Icons/video.svg';
import DJIcon from '../assets/images/Icons/music.svg';
import FloristIcon from '../assets/images/Icons/flower.svg';
import CateringIcon from '../assets/images/Icons/utensils.svg';
import BeautyIcon from '../assets/images/Icons/makeup.svg';

const categories = [
    { id: 'photography', name: 'Photography', icon: PhotographyIcon },
    { id: 'videography', name: 'Videography', icon: VideographyIcon },
    { id: 'dj', name: 'DJ', icon: DJIcon },
    { id: 'florist', name: 'Florist', icon: FloristIcon },
    { id: 'catering', name: 'Catering', icon: CateringIcon },
    { id: 'beauty', name: 'Beauty', icon: BeautyIcon }
];

function VendorHomepage() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [stats, setStats] = useState({
        activeRequests: 0,
        totalBids: 0,
        averageBidValue: 0
    });

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                // First, let's get all business profiles to see what categories exist
                const { data: allBusinessProfiles, error: businessError } = await supabase
                    .from('business_profiles')
                    .select('business_category');

                if (businessError) {
                    console.error('Error fetching business categories:', businessError);
                    return;
                }

                // Log all available categories
                const allCategories = [...new Set(allBusinessProfiles.map(p => p.business_category))];
                console.log('All available business categories:', allCategories);

                // Now get profiles with business info AND profile photos
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        business_profiles!inner (
                            business_name,
                            business_category
                        ),
                        profile_photos!inner (
                            file_path,
                            photo_type
                        )
                    `)
                    .eq('role', 'business')
                    .eq('profile_photos.photo_type', 'profile')
                    .limit(24);

                if (profilesError) {
                    console.error('Error fetching profiles:', profilesError);
                    return;
                }

                if (profilesData) {
                    console.log('Raw profiles data:', profilesData);
                    
                    // Process vendors with their photos
                    const vendorsWithPhotos = profilesData
                        .map(vendor => {
                            const photo = vendor.profile_photos[0];
                            if (!photo) return null;
                            
                            const { data } = supabase.storage
                                .from('profile-photos')
                                .getPublicUrl(photo.file_path);

                            return {
                                id: vendor.id,
                                business_name: vendor.business_profiles.business_name,
                                business_category: vendor.business_profiles.business_category,
                                photo_url: data.publicUrl
                            };
                        })
                        .filter(vendor => vendor && vendor.photo_url);

                    // Log vendors by category for debugging
                    const vendorsByCategory = {};
                    vendorsWithPhotos.forEach(vendor => {
                        if (!vendorsByCategory[vendor.business_category]) {
                            vendorsByCategory[vendor.business_category] = [];
                        }
                        vendorsByCategory[vendor.business_category].push(vendor);
                    });
                    console.log('All vendors by category:', vendorsByCategory);
                    console.log('Total number of vendors:', vendorsWithPhotos.length);

                    setVendors(vendorsWithPhotos);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchVendors();
    }, []);

    return (
        <>
            <Helmet>
                <title>Find Wedding Vendors | Bidi</title>
                <meta name="description" content="Find and compare the best wedding vendors in Utah. Read verified reviews, check prices, and book instantly with Bidi." />
            </Helmet>
            
            <div className="vendor-homepage">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">
                        <h1>Find Your Perfect Wedding Vendors</h1>
                        <p>Compare prices, read reviews, and book instantly with Bidi</p>
                    </div>
                    <div className="hero-image">
                        <img src={VendorHero} alt="Wedding Vendors" />
                    </div>
                </section>

                {/* Categories Section */}
                <section className="categories-section">
                    <h2>Browse by Category</h2>
                    <div className="categories-grid">
                        {categories.map(category => (
                            <Link 
                                key={category.id} 
                                to={`/vendors/${category.id}`}
                                className="category-card"
                            >
                                <img src={category.icon} alt={category.name} className="category-icon" />
                                <h3>{category.name}</h3>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ... rest of your existing sections ... */}
            </div>
        </>
    );
}

export default VendorHomepage; 
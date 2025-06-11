import React, { useState, useEffect } from 'react';
import '../../App.css';
import './AdminDashboard.css';
import UnviewedBids from './UnviewedBids';
import VerificationApplications from './VerificationApplications';
import AcceptedBids from './AcceptedBids';
import ImageConverter from '../admin/ImageConverter';
import MessageNotifier from './MessageNotifier';
import OldRequests from './OldRequests';
import UncontactedBusinesses from './UncontactedBusinesses';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// Add API URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [activeGroup, setActiveGroup] = useState('requests');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [googleReviewsError, setGoogleReviewsError] = useState(null);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [businessSearchQuery, setBusinessSearchQuery] = useState('');
    const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);

    // Add useEffect to fetch businesses when component mounts
    useEffect(() => {
        console.log('Component mounted, fetching businesses...');
        fetchBusinesses();
    }, []);

    // Add useEffect to fetch businesses when Google Reviews tab is active
    useEffect(() => {
        if (activeTab === 'google-reviews') {
            console.log('Google Reviews tab active, fetching businesses...');
            fetchBusinesses();
        }
    }, [activeTab]);

    const fetchBusinesses = async () => {
        try {
            console.log('Starting fetchBusinesses...');
            
            // First get all profiles with business role
            const { data: profiles, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role')
                .eq('role', 'business')
                .order('email');

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                throw profilesError;
            }

            console.log('Profiles with business role:', profiles);
            console.log('Number of business profiles found:', profiles?.length || 0);

            if (!profiles || profiles.length === 0) {
                console.log('No business profiles found in profiles table');
                setBusinesses([]);
                return;
            }

            // Get all business IDs
            const businessIds = profiles.map(profile => profile.id);
            console.log('Business IDs to fetch:', businessIds);

            // First, let's check if we can get any business profiles at all
            const { data: allBusinessProfiles, error: allBusinessError } = await supabaseAdmin
                .from('business_profiles')
                .select('*')
                .limit(5);

            console.log('Sample of all business profiles:', allBusinessProfiles);
            console.log('Error fetching all business profiles:', allBusinessError);

            // Now try to fetch specific business profiles
            const { data: businessProfiles, error: businessError } = await supabaseAdmin
                .from('business_profiles')
                .select('*')
                .in('id', businessIds);

            if (businessError) {
                console.error('Error fetching business profiles:', businessError);
                throw businessError;
            }

            console.log('Raw business profiles from database:', businessProfiles);
            console.log('Number of business profiles found:', businessProfiles?.length || 0);

            // If we have no business profiles, let's create a basic list from the profiles
            if (!businessProfiles || businessProfiles.length === 0) {
                console.log('No business profiles found, creating basic list from profiles');
                const basicBusinesses = profiles.map(profile => ({
                    id: profile.id,
                    email: profile.email,
                    business_name: `Business ${profile.id.slice(0, 8)}`,
                    business_description: '',
                    business_category: []
                }));
                console.log('Created basic businesses:', basicBusinesses);
                setBusinesses(basicBusinesses);
                return;
            }

            // Combine all the information
            const businessesWithDetails = profiles.map(profile => {
                const businessProfile = businessProfiles?.find(p => p.id === profile.id);
                console.log(`Processing business ${profile.id}:`, {
                    profile,
                    businessProfile
                });
                
                return {
                    id: profile.id,
                    email: profile.email,
                    business_name: businessProfile?.business_name || `Business ${profile.id.slice(0, 8)}`,
                    business_description: businessProfile?.business_description || '',
                    business_category: businessProfile?.business_category || []
                };
            });

            console.log('Final combined businesses:', businessesWithDetails);
            setBusinesses(businessesWithDetails);
        } catch (error) {
            console.error('Error in fetchBusinesses:', error);
            setBusinesses([]);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // First get all profiles with their roles
            const { data: profiles, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role')
                .order('email');

            if (profilesError) throw profilesError;

            // Get all user IDs
            const userIds = profiles.map(profile => profile.id);

            // Fetch individual profiles
            const { data: individualProfiles, error: individualError } = await supabaseAdmin
                .from('individual_profiles')
                .select('id, first_name, last_name')
                .in('id', userIds);

            if (individualError) throw individualError;

            // Fetch business profiles
            const { data: businessProfiles, error: businessError } = await supabaseAdmin
                .from('business_profiles')
                .select('id, business_name')
                .in('id', userIds);

            if (businessError) throw businessError;

            // Combine all the information
            const usersWithDetails = profiles.map(profile => {
                let displayName = '';
                if (profile.role === 'individual') {
                    const individualProfile = individualProfiles.find(p => p.id === profile.id);
                    displayName = individualProfile ? `${individualProfile.first_name} ${individualProfile.last_name}` : 'N/A';
                } else if (profile.role === 'business') {
                    const businessProfile = businessProfiles.find(p => p.id === profile.id);
                    displayName = businessProfile ? businessProfile.business_name : 'N/A';
                }

                return {
                    ...profile,
                    displayName
                };
            });

            setUsers(usersWithDetails);
        } catch (error) {
            console.error('Error fetching users:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignInAsUser = async (userId) => {
        try {
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            if (!profile?.email) throw new Error('User email not found');

            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: profile.email
            });

            if (error) throw error;

            if (data.properties.action_link) {
                window.open(data.properties.action_link, '_blank');
            }

        } catch (error) {
            console.error('Failed to sign in as user:', error.message);
            alert('Failed to sign in as user: ' + error.message);
        }
    };

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        // Find and set the active group based on the selected tab
        for (const [group, config] of Object.entries(tabGroups)) {
            if (config.tabs.some(tab => tab.id === tabId)) {
                setActiveGroup(group);
                break;
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return (
            user.displayName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower)
        );
    });

    const filteredBusinesses = businesses.filter(business => {
        const searchTerm = businessSearchQuery.toLowerCase();
        const businessName = (business.business_name || '').toLowerCase();
        const businessDescription = (business.business_description || '').toLowerCase();
        const businessCategory = Array.isArray(business.business_category) 
            ? business.business_category.join(' ').toLowerCase()
            : (business.business_category || '').toLowerCase();
        
        return businessName.includes(searchTerm) || 
               businessDescription.includes(searchTerm) || 
               businessCategory.includes(searchTerm);
    });

    const handleGoogleReviewsRequest = async () => {
        try {
            setIsProcessing(true);
            setGoogleReviewsError(null);

            if (!selectedBusiness) {
                setGoogleReviewsError('Please select a business');
                return;
            }

            if (!googleMapsUrl.trim()) {
                setGoogleReviewsError('Please enter a Google Maps URL');
                return;
            }

            console.log('Starting Google Reviews import for business:', selectedBusiness);

            // Step 1: Convert URL to Place ID
            const placeIdResponse = await fetch(`https://bidi-express.vercel.app/api/google-places/url-to-place-id?url=${encodeURIComponent(googleMapsUrl)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!placeIdResponse.ok) {
                const errorData = await placeIdResponse.json();
                throw new Error(errorData.message || 'Failed to convert URL to Place ID');
            }

            const { placeId } = await placeIdResponse.json();
            console.log('Retrieved Place ID:', placeId);

            if (!placeId) {
                throw new Error('Could not extract Place ID from the provided URL');
            }

            // Step 2: Fetch reviews using the Place ID
            const reviewsResponse = await fetch(`https://bidi-express.vercel.app/api/google-places/google-reviews?placeId=${placeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!reviewsResponse.ok) {
                const errorData = await reviewsResponse.json();
                throw new Error(errorData.message || 'Failed to fetch Google reviews');
            }

            const reviewsData = await reviewsResponse.json();
            console.log('Retrieved reviews data:', reviewsData);

            // Update the business profile with the Google business data
            const { error: updateError } = await supabaseAdmin
                .from('business_profiles')
                .update({
                    google_place_id: placeId,
                    google_business_name: reviewsData.business_name,
                    google_business_address: reviewsData.business_address,
                    google_rating: reviewsData.rating,
                    google_total_ratings: reviewsData.total_ratings,
                    google_maps_url: googleMapsUrl
                })
                .eq('id', selectedBusiness);

            if (updateError) {
                console.error('Database update error:', updateError);
                throw new Error(`Failed to update business profile: ${updateError.message}`);
            }

            // Then, insert the reviews into the reviews table
            if (reviewsData.reviews && reviewsData.reviews.length > 0) {
                // First, delete any existing Google reviews for this business
                const { error: deleteError } = await supabaseAdmin
                    .from('reviews')
                    .delete()
                    .eq('vendor_id', selectedBusiness)
                    .eq('is_google_review', true);

                if (deleteError) {
                    console.error('Error deleting existing reviews:', deleteError);
                    throw new Error(`Failed to delete existing reviews: ${deleteError.message}`);
                }

                // Then insert the new reviews
                const reviewsToInsert = reviewsData.reviews.map(review => ({
                    vendor_id: selectedBusiness,
                    rating: review.rating,
                    comment: review.text,
                    first_name: review.author_name,
                    profile_photo_url: review.profile_photo_url,
                    relative_time_description: review.relative_time_description,
                    is_google_review: true,
                    google_review_id: review.time.toString(), // Using timestamp as a unique ID
                    review_rating: review.rating,
                    is_approved: true // Auto-approve Google reviews
                }));

                const { error: reviewsError } = await supabaseAdmin
                    .from('reviews')
                    .insert(reviewsToInsert);

                if (reviewsError) {
                    console.error('Error inserting reviews:', reviewsError);
                    throw new Error(`Failed to insert reviews: ${reviewsError.message}`);
                }
            }

            // Clear the form
            setGoogleMapsUrl('');
            setSelectedBusiness(null);
            setBusinessSearchQuery('');

            // Show success message
            alert('Google reviews imported successfully!');
        } catch (error) {
            console.error('Error importing Google reviews:', error);
            setGoogleReviewsError(error.message || 'Failed to import Google reviews');
        } finally {
            setIsProcessing(false);
        }
    };

    // Tab groups configuration
    const tabGroups = {
        requests: {
            name: 'Requests',
            tabs: [
                { id: 'bids', label: 'Unviewed Bids' },
                { id: 'accepted', label: 'Accepted Bids' },
                { id: 'old-requests', label: 'Old Requests' },
                { id: 'uncontacted-businesses', label: 'Uncontacted Businesses' }
            ]
        },
        management: {
            name: 'Management',
            tabs: [
                { id: 'verification', label: 'Verification' },
                { id: 'users', label: 'Users List' },
                { id: 'messages', label: 'Message Notifier' }
            ]
        },
        tools: {
            name: 'Tools',
            tabs: [
                { id: 'converter', label: 'Image Converter' },
                { id: 'google-reviews', label: 'Google Reviews' }
            ]
        }
    };

    // Add this CSS to your existing styles
    const styles = `
        .business-select-container {
            position: relative;
        }

        .business-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .business-option {
            padding: 8px 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .business-option:hover {
            background-color: #f5f5f5;
        }

        .no-results {
            padding: 8px 12px;
            color: #666;
            font-style: italic;
        }
    `;

    // Add the styles to the document
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Add useEffect to log when businesses state changes
    useEffect(() => {
        console.log('Businesses state updated:', businesses);
        console.log('Number of businesses in state:', businesses.length);
    }, [businesses]);

    // Add useEffect to log when filtered businesses change
    useEffect(() => {
        console.log('Filtered businesses:', filteredBusinesses);
        console.log('Number of filtered businesses:', filteredBusinesses.length);
    }, [filteredBusinesses, businessSearchQuery]);

    // Add useEffect to log when activeTab changes
    useEffect(() => {
        console.log('Active tab changed to:', activeTab);
    }, [activeTab]);

    // Add useEffect to log when activeGroup changes
    useEffect(() => {
        console.log('Active group changed to:', activeGroup);
    }, [activeGroup]);

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-content">
                <h2 className="admin-dashboard-title">Admin Dashboard</h2>

                {/* Group Navigation */}
                <div className="admin-groups-container">
                    {Object.entries(tabGroups).map(([groupId, group]) => (
                        <div 
                            key={groupId}
                            className={`admin-group ${activeGroup === groupId ? 'active' : ''}`}
                        >
                            <button
                                className="admin-group-button"
                                onClick={() => setActiveGroup(groupId)}
                            >
                                {group.name}
                            </button>
                            {activeGroup === groupId && (
                                <div className="admin-tabs">
                                    {group.tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                                            onClick={() => handleTabClick(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="admin-content">
                    {activeTab === 'bids' && <UnviewedBids />}
                    {activeTab === 'verification' && <VerificationApplications />}
                    {activeTab === 'accepted' && <AcceptedBids />}
                    {activeTab === 'converter' && <ImageConverter />}
                    {activeTab === 'messages' && (
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h5>Message Notifier</h5>
                            </div>
                            <div className="admin-card-body">
                                <MessageNotifier />
                            </div>
                        </div>
                    )}
                    {activeTab === 'old-requests' && <OldRequests />}
                    {activeTab === 'uncontacted-businesses' && <UncontactedBusinesses />}
                    {activeTab === 'users' && (
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h5>Users List</h5>
                            </div>
                            <div className="admin-card-body">
                                {loading ? (
                                    <p>Loading users...</p>
                                ) : (
                                    <>
                                        <div className="search-container">
                                            <input
                                                type="text"
                                                placeholder="Search users by name, email, or role..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="search-input"
                                            />
                                            {searchQuery && (
                                                <button
                                                    className="clear-search"
                                                    onClick={() => setSearchQuery('')}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Desktop Table View */}
                                        <div className="admin-table-container desktop-view">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Type</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.map(user => (
                                                        <tr key={user.id}>
                                                            <td className="user-name">{user.displayName}</td>
                                                            <td className="user-email">{user.email}</td>
                                                            <td className="user-type">{user.role}</td>
                                                            <td>
                                                                <button 
                                                                    onClick={() => handleSignInAsUser(user.id)}
                                                                    className="sign-in-button"
                                                                >
                                                                    👤 Sign in as user
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="mobile-view">
                                            {filteredUsers.map(user => (
                                                <div key={user.id} className="user-card">
                                                    <div className="user-card-header">
                                                        <h6 className="user-name">{user.displayName}</h6>
                                                        <span className="user-type-badge">{user.role}</span>
                                                    </div>
                                                    <div className="user-card-body">
                                                        <p className="user-email">{user.email}</p>
                                                        <button 
                                                            onClick={() => handleSignInAsUser(user.id)}
                                                            className="sign-in-button"
                                                        >
                                                            👤 Sign in as user
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'google-reviews' && (
                        <div className="google-reviews-section">
                            <h2>Import Google Reviews</h2>
                            <div className="import-reviews-form">
                                <div className="form-group mb-4">
                                    <label htmlFor="businessSelect">Select Business</label>
                                    <div className="business-select-container">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search for a business..."
                                            value={businessSearchQuery}
                                            onChange={(e) => {
                                                setBusinessSearchQuery(e.target.value);
                                                setShowBusinessDropdown(true);
                                            }}
                                            onFocus={() => {
                                                setShowBusinessDropdown(true);
                                                console.log('Current businesses:', businesses);
                                            }}
                                        />
                                        {showBusinessDropdown && (
                                            <div className="business-dropdown">
                                                {filteredBusinesses.length > 0 ? (
                                                    filteredBusinesses.map(business => (
                                                        <div
                                                            key={business.id}
                                                            className="business-option"
                                                            onClick={() => {
                                                                setSelectedBusiness(business.id);
                                                                setBusinessSearchQuery(business.business_name || business.business_description || '');
                                                                setShowBusinessDropdown(false);
                                                            }}
                                                        >
                                                            {business.business_name || business.business_description || 'Unnamed Business'}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-results">No businesses found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group mb-4">
                                    <label htmlFor="googleMapsUrl">Google Maps URL</label>
                                    <input
                                        type="text"
                                        id="googleMapsUrl"
                                        value={googleMapsUrl}
                                        onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                        placeholder="https://maps.app.goo.gl/..."
                                        className="form-control"
                                        disabled={isProcessing}
                                    />
                                    {googleReviewsError && (
                                        <div className="error-message">{googleReviewsError}</div>
                                    )}
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGoogleReviewsRequest}
                                    disabled={!selectedBusiness || !googleMapsUrl || isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Import Reviews'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
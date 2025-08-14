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
            console.log('Starting fetchUsers...');
            
            // First get all profiles with their roles
            const { data: profiles, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role')
                .order('email');

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                throw profilesError;
            }

            console.log('Profiles found:', profiles);
            console.log('Number of profiles:', profiles?.length || 0);

            if (!profiles || profiles.length === 0) {
                console.log('No profiles found');
                setUsers([]);
                setLoading(false);
                return;
            }

            // Fetch all individual profiles (not just those matching profile IDs)
            let individualProfiles = [];
            try {
                const { data: individualData, error: individualError } = await supabaseAdmin
                    .from('individual_profiles')
                    .select('id, first_name, last_name');

                if (individualError) {
                    console.warn('Warning fetching individual profiles:', individualError);
                } else {
                    individualProfiles = individualData || [];
                    console.log('Successfully fetched all individual profiles:', individualProfiles);
                }
            } catch (error) {
                console.warn('Could not fetch individual profiles:', error);
            }

            // Fetch all business profiles (not just those matching profile IDs)
            let businessProfiles = [];
            try {
                const { data: businessData, error: businessError } = await supabaseAdmin
                    .from('business_profiles')
                    .select('id, business_name');

                if (businessError) {
                    console.warn('Warning fetching business profiles:', businessError);
                } else {
                    businessProfiles = businessData || [];
                    console.log('Successfully fetched all business profiles:', businessProfiles);
                }
            } catch (error) {
                console.warn('Could not fetch business profiles:', error);
            }

            console.log('Individual profiles found:', individualProfiles);
            console.log('Business profiles found:', businessProfiles);

            // Combine all the information with better name handling
            const usersWithDetails = profiles.map(profile => {
                let displayName = '';
                
                if (profile.role === 'individual') {
                    // Find individual profile by matching the profile ID
                    const individualProfile = individualProfiles.find(p => p.id === profile.id);
                    console.log(`Looking for individual profile with ID ${profile.id}:`, individualProfile);
                    
                    if (individualProfile && individualProfile.first_name && individualProfile.last_name) {
                        displayName = `${individualProfile.first_name} ${individualProfile.last_name}`;
                    } else if (individualProfile && individualProfile.first_name) {
                        displayName = individualProfile.first_name;
                    } else {
                        displayName = `Individual User (${profile.email})`;
                    }
                } else if (profile.role === 'business') {
                    // Find business profile by matching the profile ID
                    const businessProfile = businessProfiles.find(p => p.id === profile.id);
                    console.log(`Looking for business profile with ID ${profile.id}:`, businessProfile);
                    
                    if (businessProfile && businessProfile.business_name) {
                        displayName = businessProfile.business_name;
                    } else {
                        displayName = `Business User (${profile.email})`;
                    }
                } else {
                    displayName = `User (${profile.email})`;
                }

                console.log(`Profile ${profile.id} (${profile.role}): ${displayName}`);

                return {
                    ...profile,
                    displayName
                };
            });

            console.log('Final users with details:', usersWithDetails);
            setUsers(usersWithDetails);
        } catch (error) {
            console.error('Error fetching users:', error.message);
            setUsers([]);
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
        if (!selectedBusiness || !googleMapsUrl) {
            setGoogleReviewsError('Please select a business and provide a Google Maps URL');
            return;
        }

        setIsProcessing(true);
        setGoogleReviewsError(null);

        try {
            // Extract place ID from URL
            const placeId = extractPlaceIdFromUrl(googleMapsUrl);
            if (!placeId) {
                throw new Error('Invalid Google Maps URL');
            }

            // Make API request to import reviews
            const response = await fetch(`${API_BASE_URL}/api/google-places/import-reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessId: selectedBusiness,
                    placeId: placeId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to import Google reviews');
            }

            // Clear form
            setGoogleMapsUrl('');
            setSelectedBusiness(null);
            setBusinessSearchQuery('');

            // Show success message
            alert('Google reviews imported successfully!');
        } catch (error) {
            console.error('Error importing Google reviews:', error);
            setGoogleReviewsError(error.message || 'Failed to import Google reviews. Please try again later.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Function to reset new features modal for all users
    const resetNewFeaturesForAllUsers = async () => {
        try {
            // First, get all user preferences records
            const { data: userPreferences, error: fetchError } = await supabaseAdmin
                .from("user_preferences")
                .select("user_id, has_seen_new_features");

            if (fetchError) {
                console.error("Error fetching user preferences:", fetchError);
                alert("Failed to fetch user preferences.");
                return;
            }

            if (!userPreferences || userPreferences.length === 0) {
                alert("No user preferences found to reset.");
                return;
            }

            // Update all records that have has_seen_new_features = true
            const { error: updateError } = await supabaseAdmin
                .from("user_preferences")
                .update({ has_seen_new_features: false })
                .eq('has_seen_new_features', true);

            if (updateError) {
                console.error("Error resetting new features for all users:", updateError);
                alert("Failed to reset new features modal for all users.");
            } else {
                console.log("Successfully reset new features modal for all users.");
                alert(`New features modal has been reset for users who had seen it! They will see the updated modal on their next visit.`);
            }
        } catch (error) {
            console.error("Error in resetNewFeaturesForAllUsers:", error);
            alert("An error occurred while resetting the new features modal.");
        }
    };

    // Function to extract place ID from Google Maps URL
    const extractPlaceIdFromUrl = (url) => {
        try {
            // Handle different Google Maps URL formats
            if (!url) return null;

            // Format 1: https://maps.app.goo.gl/...
            if (url.includes('maps.app.goo.gl')) {
                const match = url.match(/[?&]q=([^&]+)/);
                if (match) {
                    const decoded = decodeURIComponent(match[1]);
                    const placeIdMatch = decoded.match(/place_id=([^&]+)/);
                    if (placeIdMatch) return placeIdMatch[1];
                }
            }

            // Format 2: https://www.google.com/maps/place/...
            if (url.includes('google.com/maps/place')) {
                const match = url.match(/place\/([^/]+)/);
                if (match) return match[1];
            }

            // Format 3: https://www.google.com/maps?cid=...
            if (url.includes('cid=')) {
                const match = url.match(/cid=([^&]+)/);
                if (match) return match[1];
            }

            return null;
        } catch (error) {
            console.error('Error extracting place ID:', error);
            return null;
        }
    };

    // Add test email sending function
    const handleSendTestEmail = async () => {
        const testData = {
            customerEmail: 'savewithbidi@gmail.com',
            businessEmail: 'savewithbidi@gmail.com',
            amount: 2500.00,
            paymentType: 'full',
            businessName: 'Test Photography Business',
            date: new Date().toISOString(),
            bidId: 'test-bid-123'
        };

        try {
            const response = await fetch('https://bidi-express.vercel.app/send-payment-receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                alert('Test payment receipt emails sent successfully!');
            } else {
                const errorData = await response.json();
                alert('Failed to send test emails: ' + (errorData.message || response.statusText));
            }
        } catch (error) {
            alert('Error sending test emails: ' + error.message);
        }
    };

    // Add database testing function
    const handleTestDatabase = async () => {
        try {
            console.log('Testing database connections...');
            
            // Test profiles table
            const { data: profilesData, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .limit(3);
            
            console.log('Profiles table test:', { data: profilesData, error: profilesError });
            
            // Test individual_profiles table
            const { data: individualData, error: individualError } = await supabaseAdmin
                .from('individual_profiles')
                .select('*')
                .limit(3);
            
            console.log('Individual profiles table test:', { data: individualData, error: individualError });
            
            // Test business_profiles table
            const { data: businessData, error: businessError } = await supabaseAdmin
                .from('business_profiles')
                .select('*')
                .limit(3);
            
            console.log('Business profiles table test:', { data: businessData, error: businessError });
            
            alert('Database test completed! Check console for results.');
        } catch (error) {
            console.error('Database test error:', error);
            alert('Database test failed: ' + error.message);
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
        },
        system: {
            name: 'System',
            tabs: [
                { id: 'features', label: 'Feature Management' }
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

    // Add useEffect to log when users state changes
    useEffect(() => {
        console.log('Users state updated:', users);
        console.log('Number of users in state:', users.length);
    }, [users]);

    // Add useEffect to log when filtered users change
    useEffect(() => {
        console.log('Filtered users:', filteredUsers);
        console.log('Number of filtered users:', filteredUsers.length);
    }, [filteredUsers, searchQuery]);

    return (
        <div className="admin-dashboard-container">
            <div style={{ margin: '16px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    style={{ background: '#A328F4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}
                    onClick={handleSendTestEmail}
                >
                    Send Test Payment Receipt Emails
                </button>
                <button
                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}
                    onClick={handleTestDatabase}
                >
                    Test Database Connections
                </button>
            </div>
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
                                        <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
                                            <strong>Debug Info:</strong> Total users: {users.length}, Filtered users: {filteredUsers.length}, Search query: "{searchQuery}"
                                        </div>
                                        
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
                                        
                                        {filteredUsers.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                {users.length === 0 ? (
                                                    <p>No users found in the system.</p>
                                                ) : (
                                                    <p>No users match your search criteria.</p>
                                                )}
                                            </div>
                                        ) : (
                                            <>
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
                    {activeTab === 'features' && (
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h5>Feature Management</h5>
                            </div>
                            <div className="admin-card-body">
                                <div className="feature-management-section">
                                    <h6>New Features Modal</h6>
                                    <p>Reset the new features modal so all users will see it again on their next visit.</p>
                                    <div className="alert alert-info">
                                        <strong>Note:</strong> This will reset the "has_seen_new_features" flag for all users in the user_preferences table.
                                    </div>
                                    <button
                                        className="btn btn-warning"
                                        onClick={resetNewFeaturesForAllUsers}
                                        style={{ marginTop: '10px' }}
                                    >
                                        <i className="fas fa-redo"></i> Reset New Features Modal for All Users
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
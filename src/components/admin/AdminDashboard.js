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
        // Filter for businesses with 'admin' in their business_category
        const adminBusinesses = businesses.filter(biz => Array.isArray(biz.business_category) && biz.business_category.includes('admin'));
        const testBusiness = adminBusinesses[0] || {
            business_name: 'Test Admin Business',
            email: 'test@example.com',
        };
        if (adminBusinesses.length === 0) {
            alert('No admin category business found. Sending to fallback test address.');
        }
        const category = 'photography';
        const subject = 'You have a new photography request on Bidi! (Test)';
        const budget = '$2000 - $3000';
        const location = 'Salt Lake City, UT';
        const date = '09/15/2024';
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <body style="margin:0; padding:0; background:#f6f9fc;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9fc; padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:32px;">
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <img src="https://www.savewithbidi.com/static/media/Bidi-Logo.27a418eddac8515e0463b805133471d0.svg" alt="Bidi Logo" width="120" style="display:block; margin:0 auto 12px;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Segoe UI,Arial,sans-serif; color:#222; font-size:22px; font-weight:600; padding-bottom:12px;">
                          Hi ${testBusiness.business_name},
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Segoe UI,Arial,sans-serif; color:#444; font-size:16px; padding-bottom:24px;">
                          You have a new <b>${category}</b> request waiting for you on Bidi!
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <table style="margin: 0 auto; background: #f6f9fc; border-radius: 8px; padding: 16px;">
                            <tr>
                              <td style="padding: 4px 12px;"><b>Budget:</b></td>
                              <td style="padding: 4px 12px;">${budget}</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 12px;"><b>Location:</b></td>
                              <td style="padding: 4px 12px;">${location}</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 12px;"><b>Date:</b></td>
                              <td style="padding: 4px 12px;">${date}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:32px;">
                          <a href="https://www.savewithbidi.com/business-dashboard"
                            style="background:#A328F4; color:#fff; text-decoration:none; font-weight:600; padding:14px 32px; border-radius:8px; font-size:16px; display:inline-block;">
                            View Request
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Segoe UI,Arial,sans-serif; color:#888; font-size:13px;">
                          Best,<br/>The Bidi Team
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `;
        try {
            const response = await fetch('/api/send-resend-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    subject,
                    htmlContent,
                    recipientEmail: testBusiness.email
                })
            });
            if (response.ok) {
                alert('Test email sent successfully!');
            } else {
                const errorData = await response.json();
                alert('Failed to send test email: ' + (errorData.message || response.statusText));
            }
        } catch (error) {
            alert('Error sending test email: ' + error.message);
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

    return (
        <div className="admin-dashboard-container">
            <button
                style={{ margin: '16px 0', background: '#A328F4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}
                onClick={handleSendTestEmail}
            >
                Send Test Business Notification Email
            </button>
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
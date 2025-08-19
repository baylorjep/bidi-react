import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { supabase } from '../../supabaseClient';

const AdminManagedBusinesses = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showWebScraperModal, setShowWebScraperModal] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [transferUserId, setTransferUserId] = useState('');
    const [transferNotes, setTransferNotes] = useState('');

    // Web scraper state
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [scrapingStatus, setScrapingStatus] = useState('idle'); // idle, scraping, success, error
    const [scrapingProgress, setScrapingProgress] = useState(0);
    const [scrapedImages, setScrapedImages] = useState([]);
    const [scrapingError, setScrapingError] = useState('');
    const [currentPortfolioImages, setCurrentPortfolioImages] = useState([]);
    const [loadingPortfolio, setLoadingPortfolio] = useState(false);

    // Form state for creating new business
    const [newBusiness, setNewBusiness] = useState({
        business_name: '',
        business_description: '',
        business_category: [],
        business_address: '',
        phone: '',
        website: '',
        admin_notes: '',
        minimum_price: '',
        membership_tier: 'free',
        autobid_enabled: false,
        is_verified: false
    });

    const businessCategories = [
        'photography', 'videography', 'dj', 'florist', 'venue', 'catering', 
        'cake', 'beauty', 'event planner/coordinator', 'rental', 'photo_booth', 
        'entertainment', 'decor', 'transportation', 'other'
    ];

    useEffect(() => {
        fetchAdminManagedBusinesses();
        fetchUsers();
    }, []);

    const fetchAdminManagedBusinesses = async () => {
        try {
            setLoading(true);
            
            // Fetch all business profiles that are managed by admin
            const { data, error } = await supabaseAdmin
                .from('business_profiles')
                .select('*')
                .eq('managed_by_admin', true)
                .order('business_name');

            if (error) throw error;
            
            setBusinesses(data || []);
        } catch (error) {
            console.error('Error fetching admin-managed businesses:', error);
            alert('Failed to fetch businesses: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            // Fetch all users for transfer functionality
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role')
                .order('email');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

// ... existing code ...

const handleCreateBusiness = async (e) => {
    e.preventDefault();
    
    try {
        // First, create a Supabase Auth user account
        const adminEmail = `admin-${crypto.randomUUID().slice(0, 8)}@bidi.local`;
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: crypto.randomUUID(), // Generate a random password
            email_confirm: true,
            user_metadata: {
                role: 'business',
                is_admin_managed: true
            }
        });

        if (authError) throw authError;

        // Use the Auth user id for both profiles and business_profiles
        const businessId = authUser?.user?.id;
        if (!businessId) throw new Error('Auth user creation failed: missing user id');

        // Then create a profile record with the correct schema - matching what Signup.js creates
        // This ensures the UserTypeSelectionModal won't show up because the profile is complete
        const profileData = {
            id: businessId,
            email: adminEmail, // Use the Auth email
            role: 'business',
            referral_partner_id: null, // Add this field that Signup.js expects
            created_at: new Date().toISOString()
        };

        console.log('Profile data being inserted:', profileData);

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([profileData]);

        if (profileError) throw profileError;

        // Then create the business profile with complete data
// ... existing code ...

            // Then create the business profile with complete data - matching what Signup.js creates
            const businessData = {
                id: businessId,
                business_name: newBusiness.business_name,
                business_description: newBusiness.business_description,
                business_category: newBusiness.business_category,
                business_address: newBusiness.business_address,
                phone: newBusiness.phone,   
                website: newBusiness.website,
                admin_notes: newBusiness.admin_notes,
                minimum_price: newBusiness.minimum_price ? parseFloat(newBusiness.minimum_price) : null,
                membership_tier: newBusiness.membership_tier,
                autobid_enabled: newBusiness.autobid_enabled,
                is_verified: newBusiness.is_verified,
                managed_by_admin: true,
                // Add these fields to make the business profile appear complete
                business_category_old: newBusiness.business_category.join(', '),
                Bidi_Plus: false,
                down_payment_type: 'percentage',
                amount: 0,
                specializations: [],
                story: '',
                verification_pending: false,
                // Add other required fields with sensible defaults
                autobid_training_completed: false,
                google_calendar_connected: false,
                stripe_onboarding_completed: false,
                autobid_status: null, // Will be set to 'live' or 'paused' when autobid is actually enabled
                notification_preferences: {},
                consultation_hours: {},
                // Add additional fields that might be required
                google_reviews_status: 'pending',
                stripe_setup_progress: 'not_started',
                transfer_pending: false,
                transfer_to_user_id: null,
                transfer_requested_at: null,
                // Add fields that Signup.js creates to ensure completeness
                stripe_account_id: null,
                is_admin: false,
                business_owner: null,
                bid_template: null,
                verified_at: null
            };

// ... existing code ...

        const { error } = await supabaseAdmin
            .from('business_profiles')
            .insert([businessData]);

        if (error) throw error;

        alert('Business created successfully!');
        setShowCreateModal(false);
        setNewBusiness({
            business_name: '',
            business_description: '',
            business_category: [],
            business_address: '',
            phone: '',
            website: '',
            admin_notes: '',
            minimum_price: '',
            membership_tier: 'free',
            autobid_enabled: false,
            is_verified: false
        });
        fetchAdminManagedBusinesses();
    } catch (error) {
        console.error('Error creating business:', error);
        alert('Failed to create business: ' + error.message);
    }
};

// ... existing code ...

    const handleTransferBusiness = async () => {
        if (!selectedBusiness || !transferUserId) {
            alert('Please select a business and user to transfer to');
            return;
        }

        try {
            // Update the business profile to mark it for transfer
            const { error } = await supabaseAdmin
                .from('business_profiles')
                .update({
                    transfer_pending: true,
                    transfer_to_user_id: transferUserId,
                    transfer_requested_at: new Date().toISOString(),
                    admin_notes: transferNotes ? 
                        `${selectedBusiness.admin_notes || ''}\n\nTRANSFER REQUESTED: ${transferNotes}` : 
                        selectedBusiness.admin_notes
                })
                .eq('id', selectedBusiness.id);

            if (error) throw error;

            alert('Transfer request created successfully! The business owner will need to complete the transfer process.');
            setShowTransferModal(false);
            setSelectedBusiness(null);
            setTransferUserId('');
            setTransferNotes('');
            fetchAdminManagedBusinesses();
        } catch (error) {
            console.error('Error requesting transfer:', error);
            alert('Failed to request transfer: ' + error.message);
        }
    };

    const handleDeleteBusiness = async (businessId) => {
        if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            return;
        }

        try {
            // First delete the business profile
            const { error: businessError } = await supabaseAdmin
                .from('business_profiles')
                .delete()
                .eq('id', businessId);

            if (businessError) throw businessError;

            // Then delete the profile record
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', businessId);

            if (profileError) {
                console.warn('Warning: Could not delete profile record:', profileError);
                // Don't throw error here as the business was deleted successfully
            }

            // Finally delete the Supabase Auth user (by id)
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(businessId);

            if (authError) {
                console.warn('Warning: Could not delete auth user:', authError);
                // Don't throw error here as the business was deleted successfully
            }

            alert('Business deleted successfully!');
            fetchAdminManagedBusinesses();
        } catch (error) {
            console.error('Error deleting business:', error);
            alert('Failed to delete business: ' + error.message);
        }
    };

    const handleEditBusiness = async (e) => {
        e.preventDefault();
        
        try {
            // Update the business profile
            const { error } = await supabaseAdmin
                .from('business_profiles')
                .update({
                    business_name: selectedBusiness.business_name,
                    business_description: selectedBusiness.business_description,
                    business_category: selectedBusiness.business_category,
                    business_address: selectedBusiness.business_address,
                    phone: selectedBusiness.phone,
                    website: selectedBusiness.website,
                    // admin_contact_email field removed - not in database schema
                    admin_notes: selectedBusiness.admin_notes,
                    minimum_price: selectedBusiness.minimum_price ? parseFloat(selectedBusiness.minimum_price) : null,
                    membership_tier: selectedBusiness.membership_tier,
                    autobid_enabled: selectedBusiness.autobid_enabled,
                    is_verified: selectedBusiness.is_verified,
                })
                .eq('id', selectedBusiness.id);

            if (error) throw error;

            // Note: No profile fields to update since profiles table only has basic auth fields
            // The business profile contains all the editable business information

            alert('Business updated successfully!');
            setShowEditModal(false);
            setSelectedBusiness(null);
            fetchAdminManagedBusinesses();
        } catch (error) {
            console.error('Error updating business:', error);
            alert('Failed to update business: ' + error.message);
        }
    };

    const handleSignInAsBusiness = async (businessId) => {
        try {
            // Load the admin auth email from profiles so it always matches Auth
            const { data: profileRow, error: profileLookupError } = await supabaseAdmin
                .from('profiles')
                .select('email')
                .eq('id', businessId)
                .single();

            if (profileLookupError) throw profileLookupError;

            const adminEmail = profileRow?.email;
            if (!adminEmail) throw new Error('Admin email not found for this business');

            // Skip user verification for now to avoid any API issues
            // Since we're creating complete business accounts, just generate the magic link

            // Generate a magic link that will authenticate immediately
            const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: adminEmail,
                options: {
                    // Send through auth-callback so linking/role detection runs, preventing the setup modal
                    redirectTo: `${window.location.origin}/auth-callback`
                }
            });

            if (linkError) throw linkError;

            if (data.properties.action_link) {
                window.open(data.properties.action_link, '_blank');
            }
        } catch (error) {
            console.error('Failed to sign in as business:', error);
            alert('Failed to sign in as business: ' + error.message);
        }
    };

    // Web scraping functions
    const handleOpenWebScraper = (business) => {
        setSelectedBusiness(business);
        setScrapeUrl(business.website || '');
        setScrapingStatus('idle');
        setScrapingProgress(0);
        setScrapedImages([]);
        setScrapingError('');
        setCurrentPortfolioImages([]);
        setShowWebScraperModal(true);
        
        // Fetch current portfolio images
        fetchCurrentPortfolioImages(business.id);
    };

    const fetchCurrentPortfolioImages = async (businessId) => {
        try {
            setLoadingPortfolio(true);
            
            // Fetch portfolio images from the profile_photos table
            const { data, error } = await supabaseAdmin
                .from('profile_photos')
                .select('*')
                .eq('user_id', businessId)
                .eq('photo_type', 'portfolio')
                .order('display_order', { ascending: true });

            if (error) throw error;
            
            setCurrentPortfolioImages(data || []);
        } catch (error) {
            console.error('Error fetching portfolio images:', error);
            setCurrentPortfolioImages([]);
        } finally {
            setLoadingPortfolio(false);
        }
    };

    const handleStartScraping = async () => {
        if (!scrapeUrl.trim()) {
            alert('Please enter a valid URL');
            return;
        }

        try {
            setScrapingStatus('scraping');
            setScrapingProgress(0);
            setScrapingError('');

            // Get the current session and access token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('No valid session found. Please sign in again.');
            }

            // Call the backend scraping API with Bearer token
            const response = await fetch('/api/admin/scrape-website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    businessId: selectedBusiness.id,
                    businessName: selectedBusiness.business_name,
                    websiteUrl: scrapeUrl,
                    businessCategory: selectedBusiness.business_category
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Start polling for progress updates
                pollScrapingStatus(selectedBusiness.id);
            } else {
                throw new Error(data.error || 'Scraping failed');
            }
        } catch (error) {
            console.error('Error during web scraping:', error);
            setScrapingStatus('error');
            setScrapingError(error.message);
            alert('Failed to scrape website: ' + error.message);
        }
    };

    const pollScrapingStatus = async (businessId) => {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;
        
        const poll = async () => {
            try {
                // Get the current session and access token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('No valid session found. Please sign in again.');
                }

                const response = await fetch(`/api/admin/scraping-status/${businessId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.status === 'completed') {
                    setScrapedImages(data.images || []);
                    setScrapingStatus('success');
                    setScrapingProgress(100);
                    
                    // Update the business website if it was different
                    if (scrapeUrl !== selectedBusiness.website) {
                        await updateBusinessWebsite(selectedBusiness.id, scrapeUrl);
                    }
                    
                    alert(`Successfully scraped ${data.images?.length || 0} images from ${scrapeUrl}`);
                } else if (data.status === 'failed') {
                    setScrapingStatus('error');
                    setScrapingError(data.error || 'Scraping failed');
                    alert('Scraping failed: ' + (data.error || 'Unknown error'));
                } else if (data.status === 'processing') {
                    // Update progress
                    setScrapingProgress(data.progress || 0);
                    
                    // Continue polling
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(poll, 2000); // Poll every 2 seconds
                    } else {
                        setScrapingStatus('error');
                        setScrapingError('Scraping timed out after 5 minutes');
                        alert('Scraping timed out. Please try again.');
                    }
                }
            } catch (error) {
                console.error('Error polling scraping status:', error);
                if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(poll, 2000);
                } else {
                    setScrapingStatus('error');
                    setScrapingError('Failed to check scraping status');
                    alert('Failed to check scraping status. Please try again.');
                }
            }
        };

        // Start polling
        poll();
    };

    const updateBusinessWebsite = async (businessId, newWebsite) => {
        try {
            const { error } = await supabaseAdmin
                .from('business_profiles')
                .update({ website: newWebsite })
                .eq('id', businessId);

            if (error) throw error;
            
            // Update local state
            setBusinesses(prev => prev.map(business => 
                business.id === businessId 
                    ? { ...business, website: newWebsite }
                    : business
            ));
        } catch (error) {
            console.error('Error updating business website:', error);
        }
    };

    const handleSaveScrapedImages = async () => {
        if (scrapedImages.length === 0) {
            alert('No images to save');
            return;
        }

        try {
            // Get the current session and access token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('No valid session found. Please sign in again.');
            }

            // Call the backend API to save the scraped images
            const response = await fetch('/api/admin/save-scraped-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    businessId: selectedBusiness.id,
                    images: scrapedImages
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                alert(`Successfully saved ${data.savedCount || 0} images to ${selectedBusiness.business_name}'s portfolio!`);
                
                // Clear scraped images and reset status
                setScrapedImages([]);
                setScrapingStatus('idle');
                setScrapingProgress(0);
                
                // Refresh the current portfolio images
                await fetchCurrentPortfolioImages(selectedBusiness.id);
                
                // Refresh the business data to show new images
                fetchAdminManagedBusinesses();
            } else {
                throw new Error(data.error || 'Failed to save images');
            }
        } catch (error) {
            console.error('Error saving scraped images:', error);
            alert('Failed to save images: ' + error.message);
        }
    };

    const handleRemovePortfolioPhoto = async (photoId) => {
        if (!window.confirm('Are you sure you want to remove this image from the portfolio?')) {
            return;
        }

        try {
            // Get the current session and access token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('No valid session found. Please sign in again.');
            }

            const response = await fetch(`/api/admin/portfolio-photo/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                alert('Image removed successfully!');
                // Refresh the business data
                fetchAdminManagedBusinesses();
            } else {
                throw new Error(data.error || 'Failed to remove image');
            }
        } catch (error) {
            console.error('Error removing portfolio photo:', error);
            alert('Failed to remove image: ' + error.message);
        }
    };

    const validateUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const filteredBusinesses = businesses.filter(business => {
        const searchLower = searchQuery.toLowerCase();
        return (
            business.business_name?.toLowerCase().includes(searchLower) ||
            business.business_description?.toLowerCase().includes(searchLower) ||
            business.business_address?.toLowerCase().includes(searchLower)
        );
    });

    const handleCategoryChange = (category) => {
        setNewBusiness(prev => ({
            ...prev,
            business_category: prev.business_category.includes(category)
                ? prev.business_category.filter(c => c !== category)
                : [...prev.business_category, category]
        }));
    };

    if (loading) {
        return <div className="tw-p-5">Loading admin-managed businesses...</div>;
    }

    return (
        <div className="tw-p-5">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-5">
                <h5 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-m-0">Admin-Managed Business Accounts</h5>
                <button 
                    className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200"
                    onClick={() => setShowCreateModal(true)}
                >
                    + Create New Business
                </button>
            </div>
            
            <div className="tw-mb-5">
                <input
                    type="text"
                    placeholder="Search businesses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="tw-w-full tw-max-w-md tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                />
            </div>

            {filteredBusinesses.length === 0 ? (
                <div className="tw-text-center tw-py-10 tw-text-gray-600">
                    <p className="tw-text-base tw-m-0">No admin-managed businesses found.</p>
                </div>
            ) : (
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-5 tw-mt-5">
                    {filteredBusinesses.map(business => (
                        <div key={business.id} className="tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white tw-shadow-sm hover:tw-shadow-md tw-transition-all tw-duration-200 hover:tw--translate-y-0.5">
                            <div className="tw-px-5 tw-py-4 tw-border-b tw-border-gray-100 tw-bg-gray-50 tw-rounded-t-lg">
                                <h6 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-m-0 tw-mb-2">{business.business_name || 'Unnamed Business'}</h6>
                                <div className="tw-flex tw-gap-2 tw-flex-wrap">
                                    {business.transfer_pending && (
                                        <span className="tw-px-2 tw-py-1 tw-bg-yellow-100 tw-text-yellow-800 tw-border tw-border-yellow-200 tw-rounded-full tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                                            Transfer Pending
                                        </span>
                                    )}
                                    {business.is_verified && (
                                        <span className="tw-px-2 tw-py-1 tw-bg-green-100 tw-text-green-800 tw-border tw-border-green-200 tw-rounded-full tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                                            Verified
                                        </span>
                                    )}
                                    <span className="tw-px-2 tw-py-1 tw-bg-gray-100 tw-text-gray-800 tw-border tw-border-gray-200 tw-rounded-full tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                                        {business.membership_tier}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="tw-p-5">
                                {business.business_description && (
                                    <p className="tw-text-gray-600 tw-mb-4 tw-leading-relaxed">{business.business_description}</p>
                                )}
                                
                                <div className="tw-flex tw-flex-col tw-gap-2 tw-mb-4">
                                    {business.business_category && business.business_category.length > 0 && (
                                        <div className="tw-text-sm tw-text-gray-600">
                                            <span className="tw-font-semibold tw-text-gray-800">Categories:</span> {business.business_category.join(', ')}
                                        </div>
                                    )}
                                    
                                    {business.business_address && (
                                        <div className="tw-text-sm tw-text-gray-600">
                                            <span className="tw-font-semibold tw-text-gray-800">Address:</span> {business.business_address}
                                        </div>
                                    )}
                                    
                                    {business.phone && (
                                        <div className="tw-text-sm tw-text-gray-600">
                                            <span className="tw-font-semibold tw-text-gray-800">Phone:</span> {business.phone}
                                        </div>
                                    )}
                                    
                                    {business.website && (
                                        <div className="tw-text-sm tw-text-gray-600">
                                            <span className="tw-font-semibold tw-text-gray-800">Website:</span> 
                                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="tw-text-blue-600 hover:tw-underline">
                                                {business.website}
                                            </a>
                                        </div>
                                    )}
                                    
                                    {/* admin_contact_email field removed - not in database schema */}
                                    
                                    {business.minimum_price && (
                                        <div className="tw-text-sm tw-text-gray-600">
                                            <span className="tw-font-semibold tw-text-gray-800">Min Price:</span> ${business.minimum_price}
                                        </div>
                                    )}
                                </div>
                                
                                {business.admin_notes && (
                                    <div className="tw-mt-4 tw-p-3 tw-bg-gray-50 tw-rounded tw-border-l-4 tw-border-blue-500">
                                        <span className="tw-font-semibold tw-text-gray-800 tw-text-sm">Admin Notes:</span>
                                        <p className="tw-text-sm tw-text-gray-600 tw-mt-2 tw-m-0 tw-leading-relaxed tw-whitespace-pre-wrap">{business.admin_notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="tw-px-5 tw-py-4 tw-border-t tw-border-gray-100 tw-flex tw-gap-3 tw-justify-end">
                                                                 <button
                                     className="tw-px-3 tw-py-1.5 tw-text-xs tw-border tw-border-green-600 tw-text-green-600 hover:tw-bg-green-600 hover:tw-text-white tw-rounded tw-transition-colors tw-duration-200"
                                     onClick={() => handleSignInAsBusiness(business.id)}
                                     title="Sign in as this business to access their account"
                                 >
                                     👤 Sign In
                                 </button>
                                 
                                 <button
                                     className="tw-px-3 tw-py-1.5 tw-text-xs tw-border tw-border-purple-600 tw-text-purple-600 hover:tw-bg-purple-600 hover:tw-text-white tw-rounded tw-transition-colors tw-duration-200"
                                     onClick={() => handleOpenWebScraper(business)}
                                     title="Scrape website for portfolio images"
                                 >
                                     🕷️ Scrape Website
                                 </button>
                                 
                                 <button
                                     className="tw-px-3 tw-py-1.5 tw-text-xs tw-border tw-border-yellow-600 tw-text-yellow-600 hover:tw-bg-yellow-600 hover:tw-text-white tw-rounded tw-transition-colors tw-duration-200"
                                     onClick={() => {
                                         setSelectedBusiness(business);
                                         setShowEditModal(true);
                                     }}
                                     title="Edit business details"
                                 >
                                     ✏️ Edit
                                 </button>
                                 
                                 <button
                                     className="tw-px-3 tw-py-1.5 tw-text-xs tw-border tw-border-blue-600 tw-text-blue-600 hover:tw-bg-blue-600 hover:tw-text-white tw-rounded tw-transition-colors tw-duration-200 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
                                     onClick={() => {
                                         setSelectedBusiness(business);
                                         setShowTransferModal(true);
                                     }}
                                     disabled={business.transfer_pending}
                                 >
                                     {business.transfer_pending ? 'Transfer Pending' : 'Transfer to User'}
                                 </button>
                                 
                                 <button
                                     className="tw-px-3 tw-py-1.5 tw-text-xs tw-border tw-border-red-600 tw-text-red-600 hover:tw-bg-red-600 hover:tw-text-white tw-rounded tw-transition-colors tw-duration-200"
                                     onClick={() => handleDeleteBusiness(business.id)}
                                 >
                                     Delete
                                 </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Business Modal */}
            {showCreateModal && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center tw-z-50">
                    <div className="tw-bg-white tw-rounded-lg tw-shadow-2xl tw-max-w-2xl tw-w-11/12 tw-max-h-screen tw-overflow-y-auto">
                        <div className="tw-px-6 tw-py-5 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
                            <h4 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">Create New Business Account</h4>
                            <button 
                                className="tw-bg-none tw-border-none tw-text-2xl tw-text-gray-400 hover:tw-text-gray-600 tw-cursor-pointer tw-p-0 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100 tw-transition-all tw-duration-200"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateBusiness} className="tw-p-6">
                            <div className="tw-mb-5">
                                <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Name *</label>
                                <input
                                    type="text"
                                    value={newBusiness.business_name}
                                    onChange={(e) => setNewBusiness(prev => ({...prev, business_name: e.target.value}))}
                                    required
                                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                />
                            </div>
                            
                            <div className="tw-mb-5">
                                <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Description</label>
                                <textarea
                                    value={newBusiness.business_description}
                                    onChange={(e) => setNewBusiness(prev => ({...prev, business_description: e.target.value}))}
                                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                    rows="3"
                                />
                            </div>
                            
                            <div className="tw-mb-5">
                                <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Categories</label>
                                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-2 tw-mt-2">
                                    {businessCategories.map(category => (
                                        <label key={category} className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newBusiness.business_category.includes(category)}
                                                onChange={() => handleCategoryChange(category)}
                                                className="tw-m-0"
                                            />
                                            {category}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                <div>
                                    <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Address</label>
                                    <input
                                        type="text"
                                        value={newBusiness.business_address}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, business_address: e.target.value}))}
                                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                    />
                                </div>
                                
                                <div>
                                    <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Phone</label>
                                    <input
                                        type="tel"
                                        value={newBusiness.phone}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, phone: e.target.value}))}
                                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                    />
                                </div>
                            </div>
                            
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                <div>
                                    <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Website</label>
                                    <input
                                        type="url"
                                        value={newBusiness.website}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, website: e.target.value}))}
                                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                    />
                                </div>
                                
                                {/* Admin Contact Email field removed - not in database schema */}
                            </div>
                            
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                <div>
                                    <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Minimum Price</label>
                                    <input
                                        type="number"
                                        value={newBusiness.minimum_price}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, minimum_price: e.target.value}))}
                                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div>
                                    <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Membership Tier</label>
                                    <select
                                        value={newBusiness.membership_tier}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, membership_tier: e.target.value}))}
                                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                    >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="tw-mb-5">
                                <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Admin Notes</label>
                                <textarea
                                    value={newBusiness.admin_notes}
                                    onChange={(e) => setNewBusiness(prev => ({...prev, admin_notes: e.target.value}))}
                                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                    rows="3"
                                    placeholder="Internal notes about this business..."
                                />
                            </div>
                            
                            <div className="tw-flex tw-flex-col tw-gap-3 tw-mb-6">
                                <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newBusiness.autobid_enabled}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, autobid_enabled: e.target.checked}))}
                                        className="tw-m-0"
                                    />
                                    Enable Autobidding
                                </label>
                                
                                <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newBusiness.is_verified}
                                        onChange={(e) => setNewBusiness(prev => ({...prev, is_verified: e.target.checked}))}
                                        className="tw-m-0"
                                    />
                                    Mark as Verified
                                </label>
                            </div>
                            
                            <div className="tw-flex tw-gap-3 tw-justify-end tw-pt-5 tw-border-t tw-border-gray-200">
                                <button type="submit" className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200">
                                    Create Business
                                </button>
                                <button 
                                    type="button" 
                                    className="tw-bg-gray-600 hover:tw-bg-gray-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Business Modal */}
            {showTransferModal && selectedBusiness && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center tw-z-50">
                    <div className="tw-bg-white tw-rounded-lg tw-shadow-2xl tw-max-w-lg tw-w-11/12 tw-max-h-screen tw-overflow-y-auto">
                        <div className="tw-px-6 tw-py-5 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
                            <h4 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">Transfer Business to User</h4>
                            <button 
                                className="tw-bg-none tw-border-none tw-text-2xl tw-text-gray-400 hover:tw-text-gray-600 tw-cursor-pointer tw-p-0 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100 tw-transition-all tw-duration-200"
                                onClick={() => setShowTransferModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="tw-px-6 tw-py-4 tw-bg-blue-50 tw-border-l-4 tw-border-blue-500 tw-mb-5">
                            <h5 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-m-0 tw-mb-2">Transferring: {selectedBusiness.business_name}</h5>
                            <p className="tw-text-sm tw-text-blue-800 tw-m-0 tw-leading-relaxed">This will mark the business account for transfer to a user. The user will need to complete the transfer process.</p>
                        </div>
                        
                        <div className="tw-px-6 tw-mb-5">
                            <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Select User to Transfer To</label>
                            <select
                                value={transferUserId}
                                onChange={(e) => setTransferUserId(e.target.value)}
                                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                required
                            >
                                <option value="">-- Select a user --</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.email} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="tw-px-6 tw-mb-5">
                            <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Transfer Notes</label>
                            <textarea
                                value={transferNotes}
                                onChange={(e) => setTransferNotes(e.target.value)}
                                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                rows="3"
                                placeholder="Notes about this transfer..."
                            />
                        </div>
                        
                        <div className="tw-flex tw-gap-3 tw-justify-end tw-px-6 tw-pb-6 tw-pt-5 tw-border-t tw-border-gray-200">
                            <button 
                                onClick={handleTransferBusiness}
                                className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                                disabled={!transferUserId}
                            >
                                Request Transfer
                            </button>
                            <button 
                                className="tw-bg-gray-600 hover:tw-bg-gray-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200"
                                onClick={() => setShowTransferModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                                         </div>
                 </div>
             )}

             {/* Edit Business Modal */}
             {showEditModal && selectedBusiness && (
                 <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center tw-z-50">
                     <div className="tw-bg-white tw-rounded-lg tw-shadow-2xl tw-max-w-2xl tw-w-11/12 tw-max-h-screen tw-overflow-y-auto">
                         <div className="tw-px-6 tw-py-5 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
                             <h4 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">Edit Business Account</h4>
                             <button 
                                 className="tw-bg-none tw-border-none tw-text-2xl tw-text-gray-400 hover:tw-text-gray-600 tw-cursor-pointer tw-p-0 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100 tw-transition-all tw-duration-200"
                                 onClick={() => setShowEditModal(false)}
                             >
                                 ×
                             </button>
                         </div>
                         
                         <form onSubmit={handleEditBusiness} className="tw-p-6">
                             <div className="tw-mb-5">
                                 <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Name *</label>
                                 <input
                                     type="text"
                                     value={selectedBusiness.business_name || ''}
                                     onChange={(e) => setSelectedBusiness(prev => ({...prev, business_name: e.target.value}))}
                                     required
                                     className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                 />
                             </div>
                             
                             <div className="tw-mb-5">
                                 <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Description</label>
                                 <textarea
                                     value={selectedBusiness.business_description || ''}
                                     onChange={(e) => setSelectedBusiness(prev => ({...prev, business_description: e.target.value}))}
                                     className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                     rows="3"
                                 />
                             </div>
                             
                             <div className="tw-mb-5">
                                 <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Categories</label>
                                 <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-2 tw-mt-2">
                                     {businessCategories.map(category => (
                                         <label key={category} className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-cursor-pointer">
                                             <input
                                                 type="checkbox"
                                                 checked={selectedBusiness.business_category?.includes(category) || false}
                                                 onChange={() => {
                                                     const currentCategories = selectedBusiness.business_category || [];
                                                     const newCategories = currentCategories.includes(category)
                                                         ? currentCategories.filter(c => c !== category)
                                                         : [...currentCategories, category];
                                                     setSelectedBusiness(prev => ({...prev, business_category: newCategories}));
                                                 }}
                                                 className="tw-m-0"
                                             />
                                             {category}
                                         </label>
                                     ))}
                                 </div>
                             </div>
                             
                             <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                 <div>
                                     <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Business Address</label>
                                     <input
                                         type="text"
                                         value={selectedBusiness.business_address || ''}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, business_address: e.target.value}))}
                                         className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                     />
                                 </div>
                                 
                                 <div>
                                     <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Phone</label>
                                     <input
                                         type="tel"
                                         value={selectedBusiness.phone || ''}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, phone: e.target.value}))}
                                         className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                     />
                                 </div>
                             </div>
                             
                             <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                 <div>
                                     <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Website</label>
                                     <input
                                         type="url"
                                         value={selectedBusiness.website || ''}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, website: e.target.value}))}
                                         className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                     />
                                 </div>
                                 
                                 {/* Admin Contact Email field removed - not in database schema */}
                             </div>
                             
                             <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                 <div>
                                     <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Minimum Price</label>
                                     <input
                                         type="number"
                                         value={selectedBusiness.minimum_price || ''}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, minimum_price: e.target.value}))}
                                         className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                         min="0"
                                         step="0.01"
                                     />
                                 </div>
                                 
                                 <div>
                                     <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Membership Tier</label>
                                     <select
                                         value={selectedBusiness.membership_tier || 'free'}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, membership_tier: e.target.value}))}
                                         className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                     >
                                         <option value="free">Free</option>
                                         <option value="pro">Pro</option>
                                         <option value="premium">Premium</option>
                                     </select>
                                 </div>
                             </div>
                             
                             <div className="tw-mb-5">
                                 <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">Admin Notes</label>
                                 <textarea
                                     value={selectedBusiness.admin_notes || ''}
                                     onChange={(e) => setSelectedBusiness(prev => ({...prev, admin_notes: e.target.value}))}
                                     className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                                     rows="3"
                                     placeholder="Internal notes about this business..."
                                 />
                             </div>
                             
                             <div className="tw-flex tw-flex-col tw-gap-3 tw-mb-6">
                                 <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-cursor-pointer">
                                     <input
                                         type="checkbox"
                                         checked={selectedBusiness.autobid_enabled || false}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, autobid_enabled: e.target.checked}))}
                                         className="tw-m-0"
                                     />
                                     Enable Autobidding
                                 </label>
                                 
                                 <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-cursor-pointer">
                                     <input
                                         type="checkbox"
                                         checked={selectedBusiness.is_verified || false}
                                         onChange={(e) => setSelectedBusiness(prev => ({...prev, is_verified: e.target.checked}))}
                                         className="tw-m-0"
                                     />
                                     Mark as Verified
                                 </label>
                             </div>
                             
                             <div className="tw-flex tw-gap-3 tw-justify-end tw-pt-5 tw-border-t tw-border-gray-200">
                                 <button type="submit" className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200">
                                     Update Business
                                 </button>
                                 <button 
                                     type="button" 
                                     className="tw-bg-gray-600 hover:tw-bg-gray-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200"
                                     onClick={() => setShowEditModal(false)}
                                 >
                                     Cancel
                                 </button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}

             {/* Web Scraper Modal */}
             {showWebScraperModal && selectedBusiness && (
                 <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center tw-z-50">
                     <div className="tw-bg-white tw-rounded-lg tw-shadow-2xl tw-max-w-4xl tw-w-11/12 tw-max-h-screen tw-overflow-y-auto">
                         <div className="tw-px-6 tw-py-5 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
                             <h4 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
                                 🕷️ Web Scraper - {selectedBusiness.business_name}
                             </h4>
                             <button 
                                 className="tw-bg-none tw-border-none tw-text-2xl tw-text-gray-400 hover:tw-text-gray-600 tw-cursor-pointer tw-p-0 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100 tw-transition-all tw-duration-200"
                                 onClick={() => setShowWebScraperModal(false)}
                             >
                                 ×
                             </button>
                         </div>
                         
                         <div className="tw-p-6">
                             {/* Business Info */}
                             <div className="tw-mb-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
                                 <h5 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">Business Information</h5>
                                 <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                                     <div>
                                         <span className="tw-font-medium tw-text-gray-700">Name:</span> {selectedBusiness.business_name}
                                     </div>
                                     <div>
                                         <span className="tw-font-medium tw-text-gray-700">Category:</span> {Array.isArray(selectedBusiness.business_category) ? selectedBusiness.business_category.join(', ') : selectedBusiness.business_category}
                                     </div>
                                     <div>
                                         <span className="tw-font-medium tw-text-gray-700">Current Website:</span> {selectedBusiness.website || 'None'}
                                     </div>
                                     <div>
                                         <span className="tw-font-medium tw-text-gray-700">Business ID:</span> {selectedBusiness.id}
                                     </div>
                                 </div>
                             </div>

                             {/* URL Input */}
                             <div className="tw-mb-6">
                                 <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium tw-text-sm">
                                     Website URL to Scrape *
                                 </label>
                                 <div className="tw-flex tw-gap-3">
                                     <input
                                         type="url"
                                         value={scrapeUrl}
                                         onChange={(e) => setScrapeUrl(e.target.value)}
                                         placeholder="https://example.com"
                                         className="tw-flex-1 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-purple-500 focus:tw-ring-2 focus:tw-ring-purple-200"
                                         disabled={scrapingStatus === 'scraping'}
                                     />
                                     <button
                                         onClick={handleStartScraping}
                                         disabled={!validateUrl(scrapeUrl) || scrapingStatus === 'scraping'}
                                         className="tw-px-4 tw-py-2 tw-bg-purple-600 hover:tw-bg-purple-700 disabled:tw-bg-gray-400 tw-text-white tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200 disabled:tw-cursor-not-allowed"
                                     >
                                         {scrapingStatus === 'scraping' ? 'Scraping...' : 'Start Scraping'}
                                     </button>
                                 </div>
                                 {!validateUrl(scrapeUrl) && scrapeUrl && (
                                     <p className="tw-text-red-500 tw-text-xs tw-mt-1">Please enter a valid URL</p>
                                 )}
                             </div>

                             {/* Progress Bar */}
                             {scrapingStatus === 'scraping' && (
                                 <div className="tw-mb-6">
                                     <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
                                         <span className="tw-text-sm tw-font-medium tw-text-gray-700">Scraping Progress</span>
                                         <span className="tw-text-sm tw-text-gray-500">{scrapingProgress}%</span>
                                     </div>
                                     <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
                                         <div 
                                             className="tw-bg-purple-600 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
                                             style={{ width: `${scrapingProgress}%` }}
                                         ></div>
                                     </div>
                                 </div>
                             )}

                             {/* Error Display */}
                             {scrapingStatus === 'error' && scrapingError && (
                                 <div className="tw-mb-6 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
                                     <h5 className="tw-text-lg tw-font-semibold tw-text-red-800 tw-mb-2">Scraping Error</h5>
                                     <p className="tw-text-red-700 tw-text-sm">{scrapingError}</p>
                                 </div>
                             )}

                             {/* Results */}
                             {scrapingStatus === 'success' && scrapedImages.length > 0 && (
                                 <div className="tw-mb-6">
                                     <h5 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
                                         Scraped Images ({scrapedImages.length})
                                     </h5>
                                     
                                     <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4">
                                         {scrapedImages.map((image, index) => (
                                             <div key={index} className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
                                                 <img 
                                                     src={image.url} 
                                                     alt={`Scraped ${index + 1}`}
                                                     className="tw-w-full tw-h-32 tw-object-cover"
                                                     onError={(e) => {
                                                         e.target.src = '/images/default.jpg';
                                                         e.target.alt = 'Image failed to load';
                                                     }}
                                                 />
                                                 <div className="tw-p-2 tw-bg-gray-50">
                                                     <p className="tw-text-xs tw-text-gray-600 tw-truncate" title={image.url}>
                                                         {image.url}
                                                     </p>
                                                     {image.alt && (
                                                         <p className="tw-text-xs tw-text-gray-500 tw-mt-1" title={image.alt}>
                                                             {image.alt}
                                                         </p>
                                                     )}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {/* Current Portfolio Images */}
                             <div className="tw-mb-6">
                                 <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
                                     <h5 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                                         Current Portfolio Images ({currentPortfolioImages.length})
                                     </h5>
                                     <button
                                         onClick={() => fetchCurrentPortfolioImages(selectedBusiness.id)}
                                         disabled={loadingPortfolio}
                                         className="tw-px-3 tw-py-1 tw-bg-gray-600 hover:tw-bg-gray-700 disabled:tw-bg-gray-400 tw-text-white tw-rounded tw-text-xs tw-font-medium tw-transition-colors tw-duration-200 disabled:tw-cursor-not-allowed"
                                         title="Refresh portfolio images"
                                     >
                                         {loadingPortfolio ? '🔄' : '🔄 Refresh'}
                                     </button>
                                 </div>
                                 
                                 {loadingPortfolio ? (
                                     <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
                                         <p className="tw-text-sm tw-text-gray-600">Loading portfolio images...</p>
                                     </div>
                                 ) : currentPortfolioImages.length > 0 ? (
                                     <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4">
                                         {currentPortfolioImages.map((image, index) => (
                                             <div key={image.id} className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-relative">
                                                 <img 
                                                     src={image.photo_url} 
                                                     alt={image.alt_text || `Portfolio ${index + 1}`}
                                                     className="tw-w-full tw-h-32 tw-object-cover"
                                                     onError={(e) => {
                                                         e.target.src = '/images/default.jpg';
                                                         e.target.alt = 'Image failed to load';
                                                     }}
                                                 />
                                                 <div className="tw-p-2 tw-bg-gray-50">
                                                     <p className="tw-text-xs tw-text-gray-600 tw-truncate" title={image.photo_url}>
                                                         {image.filename || `Image ${index + 1}`}
                                                     </p>
                                                     {image.alt_text && (
                                                         <p className="tw-text-xs tw-text-gray-500 tw-mt-1" title={image.alt_text}>
                                                             {image.alt_text}
                                                         </p>
                                                     )}
                                                     <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                                         Order: {image.display_order || index + 1}
                                                     </p>
                                                 </div>
                                                 
                                                 {/* Remove button */}
                                                 <button
                                                     onClick={() => handleRemovePortfolioPhoto(image.id)}
                                                     className="tw-absolute tw-top-2 tw-right-2 tw-bg-red-500 hover:tw-bg-red-600 tw-text-white tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-text-xs tw-font-bold tw-transition-colors tw-duration-200"
                                                     title="Remove image"
                                                 >
                                                     ×
                                                 </button>
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
                                         <p className="tw-text-sm tw-text-gray-600 tw-mb-3">
                                             No portfolio images found for this business.
                                         </p>
                                         <p className="tw-text-xs tw-text-gray-500">
                                             Use the web scraper above to add images from their website.
                                         </p>
                                     </div>
                                 )}
                             </div>

                             {/* Instructions */}
                             <div className="tw-mb-6 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
                                 <h5 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-mb-2">How it works</h5>
                                 <ol className="tw-text-blue-700 tw-text-sm tw-list-decimal tw-list-inside tw-space-y-1">
                                     <li>Enter the vendor's website URL above</li>
                                     <li>Click "Start Scraping" to begin the process</li>
                                     <li>The system will crawl the website and find relevant images</li>
                                     <li>Review the scraped images and click "Save to Portfolio"</li>
                                     <li>Images will be automatically added to the vendor's portfolio</li>
                                 </ol>
                                 <p className="tw-text-blue-600 tw-text-xs tw-mt-3 tw-italic">
                                     Note: Only images that are relevant to the business category and appear to be portfolio/work images will be included.
                                 </p>
                             </div>

                             {/* Action Buttons */}
                             <div className="tw-flex tw-gap-3 tw-justify-end tw-pt-5 tw-border-t tw-border-gray-200">
                                 {scrapingStatus === 'success' && scrapedImages.length > 0 && (
                                     <button 
                                         onClick={handleSaveScrapedImages}
                                         className="tw-px-4 tw-py-2 tw-bg-green-600 hover:tw-bg-green-700 tw-text-white tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200"
                                     >
                                         💾 Save to Portfolio
                                     </button>
                                 )}
                                 
                                 <button 
                                     className="tw-bg-gray-600 hover:tw-bg-gray-700 tw-text-white tw-px-5 tw-py-2.5 tw-rounded tw-font-medium tw-text-sm tw-transition-colors tw-duration-200"
                                     onClick={() => setShowWebScraperModal(false)}
                                 >
                                     Close
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
         </div>
     );
 };

export default AdminManagedBusinesses;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './UserTypeSelectionModal.css';

const UserTypeSelectionModal = ({ isOpen, onClose, user, userEmail, userName, onProfileCreated }) => {
    const [userType, setUserType] = useState('');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        businessName: '',
        businessCategory: [],
        businessAddress: '',
        website: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const businessCategories = [
        { id: 'photography', label: 'Photography' },
        { id: 'videography', label: 'Videography' },
        { id: 'dj', label: 'DJ' },
        { id: 'florist', label: 'Florist' },
        { id: 'venue', label: 'Venue' },
        { id: 'catering', label: 'Catering' },
        { id: 'cake', label: 'Cake' },
        { id: 'beauty', label: 'Hair & Makeup' },
        { id: 'event planner/coordinator', label: 'Event Planner/Coordinator' },
        { id: 'rental', label: 'Rental' },
        { id: 'photo_booth', label: 'Photo Booth' },
        { id: 'entertainment', label: 'Entertainment' },
        { id: 'decor', label: 'Decor' },
        { id: 'transportation', label: 'Transportation' },
        { id: 'other', label: 'Other' }
    ];

    // Extract first and last name from Google display name
    useEffect(() => {
        if (userName && !formData.firstName && !formData.lastName) {
            const nameParts = userName.split(' ');
            setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || ''
            }));
        }
    }, [userName]);

    const handleUserTypeSelect = (type) => {
        setUserType(type);
        setStep(2);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            const categoryId = value;
            if (checked) {
                setFormData(prev => ({
                    ...prev,
                    businessCategory: [...prev.businessCategory, categoryId]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    businessCategory: prev.businessCategory.filter(id => id !== categoryId)
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('UserTypeSelectionModal: Starting profile creation for user:', user.id);

        try {
            // Create profile in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: user.id,
                    email: userEmail,
                    role: userType
                }]);

            if (profileError) throw profileError;

            if (userType === 'individual' || userType === 'both') {
                // Create individual profile
                const { error: individualError } = await supabase
                    .from('individual_profiles')
                    .insert([{
                        id: user.id,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone
                    }]);

                if (individualError) throw individualError;
            }

            if (userType === 'business' || userType === 'both') {
                // Create business profile
                const { error: businessError } = await supabase
                    .from('business_profiles')
                    .insert([{
                        id: user.id,
                        business_name: formData.businessName,
                        business_category: formData.businessCategory,
                        business_address: formData.businessAddress,
                        phone: formData.phone,
                        website: formData.website,
                        membership_tier: 'free'
                    }]);

                if (businessError) throw businessError;
            }

            // Check for pending request context before redirecting
            const pendingRequestContext = sessionStorage.getItem('pendingRequestContext');
            console.log('UserTypeSelectionModal: Checking for pending request context:', pendingRequestContext);
            if (pendingRequestContext) {
                try {
                    const requestData = JSON.parse(pendingRequestContext);
                    const now = Date.now();
                    const timeDiff = now - requestData.timestamp;
                    
                    // Only restore if request context is less than 10 minutes old
                    if (timeDiff < 10 * 60 * 1000) {
                        console.log('UserTypeSelectionModal: Found pending request context, redirecting back to request flow:', requestData);
                        sessionStorage.removeItem('pendingRequestContext');
                        
                        // Redirect to restore-request route
                        navigate('/restore-request', { 
                            state: { 
                                pendingRequestContext: requestData,
                                fromOAuth: true
                            } 
                        });
                        return;
                    } else {
                        console.log('UserTypeSelectionModal: Pending request context expired, removing');
                        sessionStorage.removeItem('pendingRequestContext');
                    }
                } catch (error) {
                    console.error('UserTypeSelectionModal: Error parsing pending request context:', error);
                    sessionStorage.removeItem('pendingRequestContext');
                }
            }
            
            // Call onProfileCreated callback if provided (for missing profile modal)
            if (onProfileCreated) {
                onProfileCreated();
                return;
            }
            
            // Check if user is on signin page and redirect to appropriate dashboard
            const isOnSigninPage = window.location.pathname.includes('/signin');
            const isOnSignupPage = window.location.pathname.includes('/signup');
            const isOnCreateAccountPage = window.location.pathname.includes('/createaccount');
            
            // If user came from auth pages, redirect to dashboard. Otherwise, stay on current page
            const shouldRedirectToDashboard = isOnSigninPage || isOnSignupPage || isOnCreateAccountPage;
            
            // Redirect based on user type (only if no pending request and no callback)
            if (userType === 'both') {
                navigate(shouldRedirectToDashboard ? '/event-planner/overview' : window.location.pathname);
            } else if (userType === 'individual') {
                navigate(shouldRedirectToDashboard ? '/individual-dashboard/bids' : window.location.pathname);
            } else if (userType === 'business') {
                navigate(shouldRedirectToDashboard ? '/business-dashboard/dashboard' : window.location.pathname);
            }

        } catch (error) {
            console.error('Profile creation error:', error);
            setError(`Failed to create profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (step === 2) {
            setStep(1);
            setUserType('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="user-type-modal-overlay">
            <div className="user-type-modal">
                <div className="user-type-modal-header">
                    <h2>Welcome to Bidi!</h2>
                    <p>Let's set up your account. What type of account would you like to create?</p>
                </div>

                {step === 1 && (
                    <div className="user-type-selection">
                        <div 
                            className="user-type-option"
                            onClick={() => handleUserTypeSelect('individual')}
                        >
                            <div className="user-type-icon">🎉</div>
                            <h3>Individual</h3>
                            <p>I'm planning an event and need vendors</p>
                        </div>

                        <div 
                            className="user-type-option"
                            onClick={() => handleUserTypeSelect('business')}
                        >
                            <div className="user-type-icon">🏢</div>
                            <h3>Business</h3>
                            <p>I'm a vendor providing event services</p>
                        </div>

                        <div 
                            className="user-type-option"
                            onClick={() => handleUserTypeSelect('both')}
                        >
                            <div className="user-type-icon">🎯</div>
                            <h3>Event Planner</h3>
                            <p>I plan events and also provide services</p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-header">
                            <button type="button" onClick={goBack} className="back-button">
                                ← Back
                            </button>
                            <h3>Complete Your Profile</h3>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-section">
                            <h4>Personal Information</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        {(userType === 'business' || userType === 'both') && (
                            <div className="form-section">
                                <h4>Business Information</h4>
                                <div className="form-group">
                                    <label>Business Name *</label>
                                    <input
                                        type="text"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Categories *</label>
                                    <div className="category-grid">
                                        {businessCategories.map((category) => (
                                            <label key={category.id} className="category-checkbox">
                                                <input
                                                    type="checkbox"
                                                    name="businessCategory"
                                                    value={category.id}
                                                    checked={formData.businessCategory.includes(category.id)}
                                                    onChange={handleInputChange}
                                                />
                                                <span>{category.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Business Address</label>
                                    <input
                                        type="text"
                                        name="businessAddress"
                                        value={formData.businessAddress}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Website</label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? 'Creating Profile...' : 'Complete Setup'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UserTypeSelectionModal;

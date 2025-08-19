import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const BusinessSwitcher = ({ onBusinessSwitch, currentBusinessId }) => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            
            // Fetch all business profiles (both admin-managed and user-owned)
            const { data, error } = await supabaseAdmin
                .from('business_profiles')
                .select('id, business_name, business_description, managed_by_admin, is_verified, membership_tier')
                .order('business_name');

            if (error) throw error;
            
            setBusinesses(data || []);
            
            // Set current business if provided
            if (currentBusinessId) {
                const current = data?.find(b => b.id === currentBusinessId);
                if (current) {
                    setSelectedBusiness(current);
                }
            }
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBusinessSelect = (business) => {
        setSelectedBusiness(business);
        setShowDropdown(false);
        setSearchQuery(business.business_name);
        
        if (onBusinessSwitch) {
            onBusinessSwitch(business);
        }
    };

    const filteredBusinesses = businesses.filter(business => {
        const searchLower = searchQuery.toLowerCase();
        return (
            business.business_name?.toLowerCase().includes(searchLower) ||
            business.business_description?.toLowerCase().includes(searchLower)
        );
    });

    const getBusinessTypeBadge = (business) => {
        if (business.managed_by_admin) {
            return (
                <span className="tw-px-2 tw-py-1 tw-bg-purple-100 tw-text-purple-800 tw-border tw-border-purple-200 tw-rounded-full tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                    Admin
                </span>
            );
        }
        return (
            <span className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-border tw-border-blue-200 tw-rounded-full tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                    User
                </span>
        );
    };

    if (loading) {
        return (
            <div className="tw-relative tw-w-80">
                <div className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm tw-bg-gray-100 tw-text-gray-500">
                    Loading businesses...
                </div>
            </div>
        );
    }

    return (
        <div className="tw-relative tw-w-80">
            <div className="tw-relative">
                <input
                    type="text"
                    placeholder="Search and select business..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-2 focus:tw-ring-blue-200"
                />
                
                {selectedBusiness && (
                    <div className="tw-absolute tw-right-2 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-flex tw-gap-1">
                        {getBusinessTypeBadge(selectedBusiness)}
                        {selectedBusiness.is_verified && (
                            <span className="tw-px-1.5 tw-py-0.5 tw-bg-green-100 tw-text-green-800 tw-border tw-border-green-200 tw-rounded-full tw-text-xs tw-font-medium">
                                ✓
                            </span>
                        )}
                    </div>
                )}
            </div>

            {showDropdown && (
                <div className="tw-absolute tw-top-full tw-left-0 tw-right-0 tw-mt-1 tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-lg tw-z-50 tw-max-h-80 tw-overflow-y-auto">
                    {filteredBusinesses.length === 0 ? (
                        <div className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-500 tw-italic">
                            No businesses found
                        </div>
                    ) : (
                        filteredBusinesses.map(business => (
                            <div
                                key={business.id}
                                className={`tw-px-3 tw-py-2 tw-cursor-pointer hover:tw-bg-gray-50 tw-border-b tw-border-gray-100 last:tw-border-b-0 ${
                                    selectedBusiness?.id === business.id ? 'tw-bg-blue-50 tw-border-l-4 tw-border-blue-500' : ''
                                }`}
                                onClick={() => handleBusinessSelect(business)}
                            >
                                <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                                    <span className="tw-font-medium tw-text-gray-900 tw-text-sm">
                                        {business.business_name || 'Unnamed Business'}
                                    </span>
                                    <div className="tw-flex tw-gap-1">
                                        {getBusinessTypeBadge(business)}
                                        {business.is_verified && (
                                            <span className="tw-px-1.5 tw-py-0.5 tw-bg-green-100 tw-text-green-800 tw-border tw-border-green-200 tw-rounded-full tw-text-xs tw-font-medium">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {business.business_description && (
                                    <p className="tw-text-xs tw-text-gray-600 tw-truncate">
                                        {business.business_description}
                                    </p>
                                )}
                                
                                <div className="tw-flex tw-items-center tw-gap-2 tw-mt-1">
                                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-tracking-wide">
                                        {business.membership_tier}
                                    </span>
                                    {business.managed_by_admin && (
                                        <span className="tw-text-xs tw-text-purple-600 tw-font-medium">
                                            Admin Managed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div 
                    className="tw-fixed tw-inset-0 tw-z-40" 
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
};

export default BusinessSwitcher;

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

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('bids');
    const [activeGroup, setActiveGroup] = useState('requests');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
                { id: 'converter', label: 'Image Converter' }
            ]
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
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
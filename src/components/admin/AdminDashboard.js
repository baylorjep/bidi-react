import React, { useState, useEffect } from 'react';
import '../../App.css';
import './AdminDashboard.css';
import UnviewedBids from './UnviewedBids';
import VerificationApplications from './VerificationApplications';
import AcceptedBids from './AcceptedBids';
import ImageConverter from '../admin/ImageConverter';
import MessageNotifier from './MessageNotifier';
import OldRequests from './OldRequests';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('bids');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-content">
                <h2 className="admin-dashboard-title">Admin Dashboard</h2>

                {/* Tabs */}
                <div className="admin-tabs-container">
                    <div className="admin-tabs">
                        <button
                            className={`admin-tab ${activeTab === 'bids' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bids')}
                        >
                            Unviewed Bids
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'verification' ? 'active' : ''}`}
                            onClick={() => setActiveTab('verification')}
                        >
                            Verification
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'accepted' ? 'active' : ''}`}
                            onClick={() => setActiveTab('accepted')}
                        >
                            Accepted Bids
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Users List
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'converter' ? 'active' : ''}`}
                            onClick={() => setActiveTab('converter')}
                        >
                            Image Converter
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
                            onClick={() => setActiveTab('messages')}
                        >
                            Message Notifier
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'old-requests' ? 'active' : ''}`}
                            onClick={() => setActiveTab('old-requests')}
                        >
                            Old Requests
                        </button>
                    </div>
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
                    {activeTab === 'users' && (
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h5>Users List</h5>
                            </div>
                            <div className="admin-card-body">
                                {loading ? (
                                    <p>Loading users...</p>
                                ) : (
                                    <div className="admin-table-container">
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
                                                {users.map(user => (
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
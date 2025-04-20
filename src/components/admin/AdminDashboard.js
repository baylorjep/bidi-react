import React, { useState, useEffect } from 'react';
import '../../App.css';
import './AdminDashboard.css';
import UnviewedBids from './UnviewedBids';
import VerificationApplications from './VerificationApplications';
import AcceptedBids from './AcceptedBids';
import ImageConverter from '../admin/ImageConverter';
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
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, email')
                .order('email');

            if (error) throw error;
            setUsers(data);
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
                    </div>
                </div>

                {/* Content */}
                <div className="admin-content">
                    {activeTab === 'bids' && <UnviewedBids />}
                    {activeTab === 'verification' && <VerificationApplications />}
                    {activeTab === 'accepted' && <AcceptedBids />}
                    {activeTab === 'converter' && <ImageConverter />}
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
                                                    <th>Email</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id}>
                                                        <td className="user-email">{user.email}</td>
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
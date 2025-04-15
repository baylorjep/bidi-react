import React, { useState, useEffect } from 'react';
import '../../App.css';
import './AdminDashboard.css';
import UnviewedBids from './UnviewedBids';
import VerificationApplications from './VerificationApplications';
import AcceptedBids from './AcceptedBids'; // Import the new component
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
            // First get the user's profile data
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            if (!profile?.email) throw new Error('User email not found');

            // Generate a magic link for the user
            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: profile.email
            });

            if (error) throw error;

            // Open the magic link in a new tab
            if (data.properties.action_link) {
                window.open(data.properties.action_link, '_blank');
            }

        } catch (error) {
            console.error('Failed to sign in as user:', error.message);
            alert('Failed to sign in as user: ' + error.message);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-12">
                <h2>Admin Dashboard</h2>

                {/* Tabs */}
                <div className="d-flex justify-content-center mb-4">
                    <div className="btn-group" role="group" aria-label="Admin sections">
                        <button
                            className={`btn ${activeTab === 'bids' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('bids')}
                            style={{
                                borderRadius: '20px 0 0 20px',
                                padding: '10px 30px',
                                fontFamily: 'Outfit',
                                fontWeight: '600',
                                backgroundColor: activeTab === 'bids' ? '#A328F4' : 'white',
                                color: activeTab === 'bids' ? 'white' : '#A328F4',
                                border: '2px solid #A328F4'
                            }}
                        >
                            Unviewed Bids
                        </button>
                        <button
                            className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('verification')}
                            style={{
                                padding: '10px 30px',
                                fontFamily: 'Outfit',
                                fontWeight: '600',
                                backgroundColor: activeTab === 'verification' ? '#A328F4' : 'white',
                                color: activeTab === 'verification' ? 'white' : '#A328F4',
                                border: '2px solid #A328F4'
                            }}
                        >
                            Verification Applications
                        </button>
                        <button
                            className={`btn ${activeTab === 'accepted' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('accepted')}
                            style={{
                                padding: '10px 30px',
                                fontFamily: 'Outfit',
                                fontWeight: '600',
                                backgroundColor: activeTab === 'accepted' ? '#A328F4' : 'white',
                                color: activeTab === 'accepted' ? 'white' : '#A328F4',
                                border: '2px solid #A328F4'
                            }}
                        >
                            Accepted Bids
                        </button>
                        <button
                            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('users')}
                            style={{
                                borderRadius: '0 20px 20px 0',
                                padding: '10px 30px',
                                fontFamily: 'Outfit',
                                fontWeight: '600',
                                backgroundColor: activeTab === 'users' ? '#A328F4' : 'white',
                                color: activeTab === 'users' ? 'white' : '#A328F4',
                                border: '2px solid #A328F4'
                            }}
                        >
                            Users List
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="admin-content">
                    {activeTab === 'bids' && <UnviewedBids />}
                    {activeTab === 'verification' && <VerificationApplications />}
                    {activeTab === 'accepted' && <AcceptedBids />}
                    {activeTab === 'users' && (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Users List</h5>
                            </div>
                            <div className="card-body">
                                {loading ? (
                                    <p>Loading users...</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id}>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <button 
                                                                onClick={() => handleSignInAsUser(user.id)}
                                                                className="btn btn-sm"
                                                                style={{
                                                                    backgroundColor: '#A328F4',
                                                                    color: 'white',
                                                                    fontFamily: 'Outfit',
                                                                    fontWeight: '600'
                                                                }}
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
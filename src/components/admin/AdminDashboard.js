import React, { useState } from 'react';
import '../../App.css';
import './AdminDashboard.css';
import UnviewedBids from './UnviewedBids';
import VerificationApplications from './VerificationApplications';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('bids');

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
                                borderRadius: '0 20px 20px 0',
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
                    </div>
                </div>

                {/* Content */}
                <div className="admin-content">
                    {activeTab === 'bids' ? <UnviewedBids /> : <VerificationApplications />}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
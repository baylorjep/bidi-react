import React from 'react';
import '../../App.css';
import './AdminDashboard.css'; // Import the CSS file
import UnviewedBids from './UnviewedBids';

function AdminDashboard() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-12">
                <h2>Admin Dashboard</h2>
                <div className="admin-content">
                    <UnviewedBids />
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
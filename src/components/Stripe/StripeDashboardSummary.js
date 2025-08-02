import React, { useState, useEffect } from 'react';
import './StripeDashboardSummary.css';

const StripeDashboardSummary = ({ accountId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('https://bidi-express.vercel.app/stripe-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchDashboardData();
      // Refresh data every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [accountId]);

  if (loading) return (
    <div className="stripe-dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading payment information...</p>
    </div>
  );
  
  if (error) return (
    <div className="stripe-dashboard-error">
      <p>Error loading payment information: {error}</p>
      <button 
        className="btn btn-secondary mt-3"
        onClick={fetchDashboardData}
      >
        Try Again
      </button>
    </div>
  );
  
  if (!dashboardData) return null;

  const { balance, payouts, charges, account_status } = dashboardData;
  const availableBalance = balance?.available?.[0]?.amount || 0;
  const pendingBalance = balance?.pending?.[0]?.amount || 0;

  return (
    <div className="stripe-dashboard-summary">
      <div className="dashboard-header">
        <h3>Payment Dashboard</h3>
        <button 
          className="btn btn-secondary btn-sm refresh-button"
          onClick={fetchDashboardData}
        >
          Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card balance-card">
          <h4>Available Balance</h4>
          <div className="balance-amount">
            ${(availableBalance / 100).toFixed(2)}
          </div>
          {pendingBalance > 0 && (
            <div className="pending-balance">
              Pending: ${(pendingBalance / 100).toFixed(2)}
            </div>
          )}
        </div>

        <div className="dashboard-card status-card">
          <h4>Account Status</h4>
          <div className="status-items">
            <div className="status-item">
              <span>Charges</span>
              <span className={`status ${account_status?.charges_enabled ? 'active' : 'inactive'}`}>
                {account_status?.charges_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-item">
              <span>Payouts</span>
              <span className={`status ${account_status?.payouts_enabled ? 'active' : 'inactive'}`}>
                {account_status?.payouts_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h4>Recent Payouts</h4>
        <div className="transactions-list">
          {payouts?.length > 0 ? (
            payouts.map(payout => (
              <div key={payout.id} className="transaction-item">
                <div className="transaction-amount">
                  ${(payout.amount / 100).toFixed(2)}
                </div>
                <div className="transaction-details">
                  <span className="transaction-date">
                    {new Date(payout.created * 1000).toLocaleDateString()}
                  </span>
                  <span className={`status ${payout.status}`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No recent payouts</div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h4>Recent Payments</h4>
        <div className="transactions-list">
          {charges?.length > 0 ? (
            charges.map(charge => (
              <div key={charge.id} className="transaction-item">
                <div className="transaction-amount">
                  ${(charge.amount / 100).toFixed(2)}
                </div>
                <div className="transaction-details">
                  <span className="transaction-date">
                    {new Date(charge.created * 1000).toLocaleDateString()}
                  </span>
                  <span className={`status ${charge.status}`}>
                    {charge.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No recent payments</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeDashboardSummary;
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
    <div className="stripe-dashboard-summary-stripe-dashboard">
      <div className="dashboard-header-stripe-dashboard">
        <h3>Payment Dashboard</h3>
        <button 
          className="btn btn-secondary btn-sm refresh-button-stripe-dashboard"
          onClick={fetchDashboardData}
        >
          Refresh
        </button>
      </div>

      <div className="dashboard-grid-stripe-dashboard">
        <div className="dashboard-card-stripe-dashboard balance-card-stripe-dashboard">
          <h4>Available Balance</h4>
          <div className="balance-amount-stripe-dashboard">
            ${(availableBalance / 100).toFixed(2)}
          </div>
          {pendingBalance > 0 && (
            <div className="pending-balance-stripe-dashboard">
              Pending: ${(pendingBalance / 100).toFixed(2)}
            </div>
          )}
        </div>

        <div className="dashboard-card-stripe-dashboard status-card-stripe-dashboard">
          <h4>Account Status</h4>
          <div className="status-items-stripe-dashboard">
            <div className="status-item-stripe-dashboard">
              <span>Charges</span>
              <span className={`status-stripe-dashboard ${account_status?.charges_enabled ? 'active' : 'inactive'}`}>
                {account_status?.charges_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-item-stripe-dashboard">
              <span>Payouts</span>
              <span className={`status-stripe-dashboard ${account_status?.payouts_enabled ? 'active' : 'inactive'}`}>
                {account_status?.payouts_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section-stripe-dashboard">
        <h4>Recent Payouts</h4>
        <div className="transactions-list-stripe-dashboard">
          {payouts?.length > 0 ? (
            payouts.map(payout => (
              <div key={payout.id} className="transaction-item-stripe-dashboard">
                <div className="transaction-amount-stripe-dashboard">
                  ${(payout.amount / 100).toFixed(2)}
                </div>
                <div className="transaction-details-stripe-dashboard">
                  <span className="transaction-date-stripe-dashboard">
                    {new Date(payout.created * 1000).toLocaleDateString()}
                  </span>
                  <span className={`status-stripe-dashboard ${payout.status}`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-stripe-dashboard">No recent payouts</div>
          )}
        </div>
      </div>

      <div className="dashboard-section-stripe-dashboard">
        <h4>Recent Payments</h4>
        <div className="transactions-list-stripe-dashboard">
          {charges?.length > 0 ? (
            charges.map(charge => (
              <div key={charge.id} className="transaction-item-stripe-dashboard">
                <div className="transaction-amount-stripe-dashboard">
                  ${(charge.amount / 100).toFixed(2)}
                </div>
                <div className="transaction-details-stripe-dashboard">
                  <span className="transaction-date-stripe-dashboard">
                    {new Date(charge.created * 1000).toLocaleDateString()}
                  </span>
                  <span className={`status-stripe-dashboard ${charge.status}`}>
                    {charge.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-stripe-dashboard">No recent payments</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeDashboardSummary;
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './StripeDashboardSummary.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StripeDashboardSummary = ({ accountId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, 6months, year

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

  // Process payment data for the graph
  const processPaymentData = () => {
    if (!charges) return null;

    // Get the start date based on selected time range
    const getStartDate = () => {
      const now = new Date();
      switch (timeRange) {
        case 'week':
          return new Date(now.setDate(now.getDate() - 7));
        case 'month':
          return new Date(now.setMonth(now.getMonth() - 1));
        case '6months':
          return new Date(now.setMonth(now.getMonth() - 6));
        case 'year':
          return new Date(now.setFullYear(now.getFullYear() - 1));
        default:
          return new Date(now.setDate(now.getDate() - 7));
      }
    };

    const startDate = getStartDate();
    
    // Filter and group payments by date
    const paymentsByDate = charges.reduce((acc, charge) => {
      const chargeDate = new Date(charge.created * 1000);
      if (chargeDate >= startDate) {
        const dateStr = chargeDate.toLocaleDateString();
        acc[dateStr] = (acc[dateStr] || 0) + charge.amount / 100;
      }
      return acc;
    }, {});

    // Fill in missing dates with zero values
    const fillMissingDates = () => {
      const dates = {};
      const currentDate = new Date(startDate);
      const endDate = new Date();

      while (currentDate <= endDate) {
        const dateStr = currentDate.toLocaleDateString();
        dates[dateStr] = paymentsByDate[dateStr] || 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const filledDates = fillMissingDates();
    const sortedDates = Object.keys(filledDates).sort((a, b) => new Date(a) - new Date(b));
    
    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Payments',
          data: sortedDates.map(date => filledDates[date]),
          borderColor: '#FF69B4',
          backgroundColor: 'rgba(255, 105, 180, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const chartData = processPaymentData();
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    }
  };

  return (
    <div className="stripe-dashboard-summary-stripe-dashboard">
      <div className="dashboard-header-stripe-dashboard">
        <h3>Payment Dashboard</h3>
        <button 
          className="refresh-button-stripe-dashboard"
          onClick={fetchDashboardData}
        >
          <i className="fas fa-sync-alt"></i>
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

      {/* Payment Graph */}
      {chartData && (
        <div className="dashboard-section-stripe-dashboard">
          <div className="chart-header-stripe-dashboard">
            <h4>Payment History</h4>
            <div className="time-range-selector-stripe-dashboard">
              <button 
                className={`time-range-button-stripe-dashboard ${timeRange === 'week' ? 'active' : ''}`}
                onClick={() => setTimeRange('week')}
              >
                Week
              </button>
              <button 
                className={`time-range-button-stripe-dashboard ${timeRange === 'month' ? 'active' : ''}`}
                onClick={() => setTimeRange('month')}
              >
                Month
              </button>
              <button 
                className={`time-range-button-stripe-dashboard ${timeRange === '6months' ? 'active' : ''}`}
                onClick={() => setTimeRange('6months')}
              >
                6 Months
              </button>
              <button 
                className={`time-range-button-stripe-dashboard ${timeRange === 'year' ? 'active' : ''}`}
                onClick={() => setTimeRange('year')}
              >
                Year
              </button>
            </div>
          </div>
          <div className="chart-container-stripe-dashboard">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

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
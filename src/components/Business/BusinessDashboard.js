import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

function BusinessDashboard() {
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [pendingBidsCount, setPendingBidsCount] = useState(0);
  const [acceptedBidsCount, setAcceptedBidsCount] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessDashboardData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const businessId = userData?.user?.id;

        // Fetch request IDs that the business has already bid on
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('request_id')
          .eq('id', businessId);

        if (bidsError) throw bidsError;

        const bidRequestIds = bidsData.map(bid => bid.request_id);

        // Fetch count of new requests (those the business hasn't bid on)
        const { count: newRequestsCount, error: newRequestsError } = await supabase
          .from('requests')
          .select('*', { count: 'exact' })
          .eq('open', true)
          .not('id', 'in', bidRequestIds.length ? bidRequestIds : ['']);

        if (newRequestsError) throw newRequestsError;
        setNewRequestsCount(newRequestsCount);

        // Fetch count of pending bids by the business
        const { count: pendingBidsCount, error: pendingBidsError } = await supabase
          .from('bids')
          .select('*', { count: 'exact' })
          .eq('id', businessId)
          .eq('status', 'pending');

        if (pendingBidsError) throw pendingBidsError;
        setPendingBidsCount(pendingBidsCount);

        // Fetch count of accepted bids by the business
        const { count: acceptedBidsCount, error: acceptedBidsError } = await supabase
          .from('bids')
          .select('*', { count: 'exact' })
          .eq('id', businessId)
          .eq('status', 'accepted');

        if (acceptedBidsError) throw acceptedBidsError;
        setAcceptedBidsCount(acceptedBidsCount);

      } catch (err) {
        console.error('Error fetching business dashboard data:', err);
        setError(err.message);
      }
    };

    fetchBusinessDashboardData();
  }, []);

  const handleCardClick = (type) => {
    switch (type) {
      case 'new':
        navigate('/open-requests');  // Navigate to open requests
        break;
      case 'pending':
        navigate('/my-bids');  // Navigate to pending bids
        break;
      case 'approved':
        navigate('/my-accepted-bids');  // Navigate to accepted bids (or a new route if needed)
        break;
      default:
        break;
    }
  };

  return (
    <div className="container">
      <h2>Business Dashboard</h2>
      {error && <p className="text-danger">{error}</p>}

      <div className="row">
        {/* New Requests */}
        <div className="col-lg-4">
          <div className="card text-center clickable-card" onClick={() => handleCardClick('new')}>
            <div className="card-body">
              <h5 className="card-title">New Requests</h5>
              <p className="card-text">{newRequestsCount}</p>
            </div>
          </div>
        </div>

        {/* Pending Bids */}
        <div className="col-lg-4">
          <div className="card text-center clickable-card" onClick={() => handleCardClick('pending')}>
            <div className="card-body">
              <h5 className="card-title">Pending Bids</h5>
              <p className="card-text">{pendingBidsCount}</p>
            </div>
          </div>
        </div>

        {/* Accepted Bids */}
        <div className="col-lg-4">
          <div className="card text-center clickable-card" onClick={() => handleCardClick('approved')}>
            <div className="card-body">
              <h5 className="card-title">Accepted Bids</h5>
              <p className="card-text">{acceptedBidsCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessDashboard;

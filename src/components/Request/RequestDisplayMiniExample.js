import React, { useState } from 'react';
import RequestDisplayMini from './RequestDisplayMini';

const RequestDisplayMiniExample = () => {
  const [vendorInterest, setVendorInterest] = useState(null);
  const [bidCount, setBidCount] = useState(0);

  // Example request data
  const exampleRequest = {
    id: 1,
    event_title: "Summer Wedding at Mountain View",
    event_type: "Wedding",
    location: "Park City, UT",
    start_date: "2024-07-15",
    date_flexibility: "specific",
    price_range: "5000-8000",
    created_at: "2024-01-15T10:30:00Z",
    user_id: "user123"
  };

  const handleInterestChange = (newInterest) => {
    setVendorInterest(newInterest);
    if (newInterest === 'bidding') {
      setBidCount(prev => prev + 1);
    }
  };

  const handleViewMore = (requestId) => {
    console.log('View more details for request:', requestId);
    // Navigate to detailed view or open modal
  };

  const handleMessageClick = (userId) => {
    console.log('Open message with user:', userId);
    // Open messaging interface
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>RequestDisplayMini Examples</h2>
      
      <h3>1. New Request (No Interest Yet)</h3>
      <RequestDisplayMini
        request={exampleRequest}
        vendorInterest={null}
        bidCount={0}
        isClientRequested={false}
        onViewMore={handleViewMore}
        onMessageClick={handleMessageClick}
      />

      <h3>2. Vendor Interested</h3>
      <RequestDisplayMini
        request={exampleRequest}
        vendorInterest="interested"
        bidCount={3}
        isClientRequested={false}
        onViewMore={handleViewMore}
        onMessageClick={handleMessageClick}
      />

      <h3>3. Vendor Bidding</h3>
      <RequestDisplayMini
        request={exampleRequest}
        vendorInterest="bidding"
        bidCount={5}
        isClientRequested={false}
        onViewMore={handleViewMore}
        onMessageClick={handleMessageClick}
      />

      <h3>4. Client Requested You</h3>
      <RequestDisplayMini
        request={exampleRequest}
        vendorInterest="interested"
        bidCount={2}
        isClientRequested={true}
        onViewMore={handleViewMore}
        onMessageClick={handleMessageClick}
      />

      <h3>5. Awarded Project</h3>
      <RequestDisplayMini
        request={exampleRequest}
        vendorInterest="awarded"
        bidCount={8}
        isClientRequested={false}
        onViewMore={handleViewMore}
        onMessageClick={handleMessageClick}
      />

      <h3>6. Not Interested</h3>
      <RequestDisplayMini
        request={exampleRequest}
        vendorInterest="not_interested"
        bidCount={4}
        isClientRequested={false}
        onViewMore={handleViewMore}
        onMessageClick={handleMessageClick}
      />

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4>Interest Status Legend:</h4>
        <ul>
          <li><strong>👍 Interested</strong> - Vendor has shown interest but hasn't bid yet</li>
          <li><strong>👎 Not Interested</strong> - Vendor has declined the opportunity</li>
          <li><strong>💼 Bidding</strong> - Vendor has submitted a bid</li>
          <li><strong>🏆 Awarded</strong> - Vendor won the project</li>
          <li><strong>⭐ Client Requested You</strong> - Client specifically requested this vendor</li>
        </ul>
      </div>
    </div>
  );
};

export default RequestDisplayMiniExample; 
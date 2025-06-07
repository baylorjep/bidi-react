import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleBusinessCallback = () => {
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          window.opener.postMessage({
            type: 'GOOGLE_BUSINESS_AUTH_ERROR',
            error: error
          }, window.opener.origin);
          window.close();
          return;
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange the code for tokens and business info
        const response = await fetch('http://localhost:5000/api/google-places/business-profile/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const data = await response.json();

        // Send the success message back to the main window
        window.opener.postMessage({
          type: 'GOOGLE_BUSINESS_AUTH_SUCCESS',
          accountId: data.accountId,
          locationId: data.locationId,
          businessName: data.businessName,
          location: data.location
        }, window.opener.origin);

        // Close the popup window
        window.close();
      } catch (error) {
        // Send error message back to the main window
        window.opener.postMessage({
          type: 'GOOGLE_BUSINESS_AUTH_ERROR',
          error: error.message
        }, window.opener.origin);
        window.close();
      }
    };

    handleCallback();
  }, [location]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Completing Google Business Profile Connection...</h2>
        <p>Please wait while we complete the connection process.</p>
        <p>This window will close automatically.</p>
      </div>
    </div>
  );
};

export default GoogleBusinessCallback; 
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

const GoogleBusinessCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Starting callback handling...');
        // Get the authorization code from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');
        const businessProfileId = params.get('businessProfileId');

        console.log('URL params:', { 
          code: code ? 'present' : 'missing', 
          error,
          businessProfileId: businessProfileId ? 'present' : 'missing'
        });

        if (error) {
          console.error('Auth error from Google:', error);
          navigate('/business-profile/error', { 
            state: { message: error }
          });
          return;
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        if (!businessProfileId) {
          throw new Error('No business profile ID provided');
        }

        console.log('Exchanging code for tokens...');
        // Exchange the code for tokens and business info
        const response = await fetch('http://localhost:5000/api/google-places/business-profile/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            code,
            businessProfileId
          })
        });

        console.log('Server response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Server error response:', errorData);
          let errorMessage;
          try {
            const jsonError = JSON.parse(errorData);
            errorMessage = jsonError.message || 'Failed to exchange authorization code';
          } catch {
            errorMessage = errorData || 'Failed to exchange authorization code';
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Received data from callback:', data);

        if (!data.accountId || !data.locationId) {
          throw new Error('Missing required data from server response');
        }

        // Send the success message back to the main window
        if (window.opener) {
          console.log('Sending success message to opener window...');
          window.opener.postMessage({
            type: 'GOOGLE_BUSINESS_AUTH_SUCCESS',
            accountId: data.accountId,
            locationId: data.locationId,
            businessName: data.businessName,
            location: data.location
          }, window.opener.origin);

          // Navigate to success page
          navigate('/business-profile/success');
        } else {
          console.error('No opener window found');
          throw new Error('No opener window found');
        }
      } catch (error) {
        console.error('Error in callback:', error);
        // Send error message back to the main window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_BUSINESS_AUTH_ERROR',
            error: error.message || 'An error occurred during authentication'
          }, window.opener.origin);
        }
        // Navigate to error page
        navigate('/business-profile/error', { 
          state: { message: error.message || 'An error occurred during authentication' }
        });
      }
    };

    handleCallback();
  }, [location, navigate]);

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
        <LoadingSpinner color="#9633eb" size={50} />
      </div>
    </div>
  );
};

export default GoogleBusinessCallback; 
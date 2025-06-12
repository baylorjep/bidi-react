import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';

const GoogleBusinessSuccess = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if the tokens were actually stored
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/google-places/business-profile/status');
        const data = await response.json();
        if (!data.connected) {
          setError('Connection may not have completed successfully. Please try again.');
        }
      } catch (err) {
        setError('Unable to verify connection status. Please check your settings.');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnectionStatus();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner color="#9633eb" size={50} />
          <p style={{ marginTop: '20px' }}>Verifying connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center',
          maxWidth: '600px',
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Connection Status Unclear</h2>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#9633eb',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        textAlign: 'center',
        maxWidth: '600px',
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#28a745', marginBottom: '20px' }}>Successfully Connected!</h2>
        <p style={{ marginBottom: '20px' }}>Your business profile has been successfully connected to Google Business Profile.</p>
        <button
          onClick={() => window.location.href = '/business-settings'}
          style={{
            backgroundColor: '#9633eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Return to Settings
        </button>
      </div>
    </div>
  );
};

export default GoogleBusinessSuccess; 